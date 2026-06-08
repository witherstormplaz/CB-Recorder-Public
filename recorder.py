"""
Stream recorder -- custom robust downloader.

Chaturbate uses Low Latency HLS (LL-HLS) and serves video and audio as
two completely separate live streams. If you try to download and merge
both streams simultaneously on the fly, ffmpeg struggles to keep them
synchronized and drops packets, resulting in "jumpy" or corrupted video.

This script fixes that by:
  1. Resolving the raw stream URLs via yt-dlp.
  2. Downloading the video and audio streams to separate files concurrently
     using independent ffmpeg processes.
  3. Merging them perfectly into a standard MP4 only AFTER recording finishes.
"""

import os
import sys
import time
import subprocess
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

import yt_dlp


def _sanitize_filename(name: str) -> str:
    """Remove characters that are unsafe in Windows/Linux file names."""
    keepchars = (" ", ".", "_", "-")
    return "".join(c if (c.isalnum() or c in keepchars) else "_" for c in name).strip()


def _build_output_paths(title: str | None, output_dir: str):
    """Build output file paths for temp and final files."""
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    base = _sanitize_filename(title) if title else "stream"
    if len(base) > 80:
        base = base[:80]
        
    prefix = os.path.join(output_dir, f"{base}_{timestamp}")
    return {
        "final": f"{prefix}.mp4",
        "video_tmp": f"{prefix}_video.ts",
        "audio_tmp": f"{prefix}_audio.ts",
        "combined_tmp": f"{prefix}_combined.ts",
    }


def _stop_process(process: subprocess.Popen):
    """Stop a background downloader process."""
    if process.poll() is None:
        try:
            # Terminate immediately (safe for .ts streams)
            process.terminate()
            process.wait(timeout=3)
        except Exception:
            process.kill()


def _merge_streams(video_path: str, audio_path: str, final_path: str) -> bool:
    """Merge separate video and audio TS files into an MP4."""
    print("\n[MERGE] Merging video and audio tracks...")
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "warning", "-y",
        "-i", video_path,
        "-i", audio_path,
        "-c", "copy",
        "-map", "0:v:0",
        "-map", "1:a:0?",
        "-movflags", "+faststart",
        final_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0 and os.path.exists(final_path):
        return True
    else:
        print(f"[FAIL] Merge failed: {result.stderr}")
        return False


def _remux_stream(ts_path: str, final_path: str) -> bool:
    """Remux a single TS file into an MP4."""
    print("\n[REMUX] Finalizing MP4 container...")
    cmd = [
        "ffmpeg", "-hide_banner", "-loglevel", "warning", "-y",
        "-i", ts_path,
        "-c", "copy",
        "-movflags", "+faststart",
        final_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0 and os.path.exists(final_path):
        return True
    else:
        print(f"[FAIL] Remux failed: {result.stderr}")
        return False


def record_stream(
    url: str,
    output_dir: str = "recordings",
    cookies_file: str | None = None,
    cookies_from_browser: str | None = None,
    duration: int | None = None,
) -> str:
    
    # ---- 1. Resolve Stream URLs ----------------------------------------
    print(f"[INFO] Resolving stream: {url}")
    
    probe_opts = {
        "quiet": True,
        "no_warnings": True,
        "format": "bestvideo+bestaudio/best",
    }
    if cookies_file:
        probe_opts["cookiefile"] = cookies_file
    if cookies_from_browser:
        probe_opts["cookiesfrombrowser"] = (cookies_from_browser,)

    try:
        with yt_dlp.YoutubeDL(probe_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception as e:
        print(f"[FAIL] Could not resolve stream: {e}")
        if "login" in str(e).lower() or "private" in str(e).lower():
            print("\n[TIP]  This stream may require authentication.")
            print("       Use --cookies <file> or --cookies-from-browser <browser>")
        sys.exit(1)

    title = info.get("title", "(unknown)")
    
    # Identify URLs
    video_url = None
    audio_url = None
    combined_url = None

    req_formats = info.get("requested_formats")
    if req_formats and len(req_formats) >= 2:
        # separate video and audio streams
        video_url = req_formats[0].get("url")
        audio_url = req_formats[1].get("url")
    elif req_formats and len(req_formats) == 1:
        combined_url = req_formats[0].get("url")
    else:
        combined_url = info.get("url")
        
    if not combined_url and not video_url:
        print("[FAIL] Could not extract direct stream URLs.")
        sys.exit(1)

    paths = _build_output_paths(title, output_dir)
    
    # ---- 2. Download ---------------------------------------------------
    duration_str = f"{duration}s" if duration else "until Ctrl+C"
    mode_str = "Separate (Video + Audio)" if video_url else "Combined"
    
    print("")
    print("=" * 60)
    print(f"  Recording: {title}")
    print(f"  Mode:      {mode_str}")
    print(f"  Duration:  {duration_str}")
    print(f"  Output:    {output_dir}/")
    print(f"  Press Ctrl+C to stop recording")
    print("=" * 60)
    print("")

    processes = []
    
    # Function to spawn streamlink downloader
    def spawn_downloader(url, out_path):
        cmd = [
            sys.executable, "-m", "streamlink",
            "--loglevel", "error",
            "--stream-segment-threads", "3",
            "--stream-timeout", "15",
            url, "best",
            "-o", out_path
        ]
        return subprocess.Popen(cmd, stdin=subprocess.PIPE)

    start_time = time.monotonic()
    
    if combined_url:
        p = spawn_downloader(combined_url, paths["combined_tmp"])
        processes.append(p)
    else:
        p_vid = spawn_downloader(video_url, paths["video_tmp"])
        p_aud = spawn_downloader(audio_url, paths["audio_tmp"])
        processes.append(p_vid)
        processes.append(p_aud)

    # Polling loop
    stopped_reason = None
    try:
        while True:
            # Check if any process died unexpectedly
            dead = [p for p in processes if p.poll() is not None]
            if dead:
                stopped_reason = "stream ended or error"
                break
                
            # Check duration
            if duration and (time.monotonic() - start_time) >= duration:
                stopped_reason = "duration limit reached"
                break
                
            time.sleep(1)
            
    except KeyboardInterrupt:
        stopped_reason = "user cancelled"

    # ---- 3. Stop and Cleanup -------------------------------------------
    elapsed = time.monotonic() - start_time
    print(f"\n[STOP] Stopping recording ({stopped_reason} after {elapsed:.0f}s)...")
    
    # Stop processes gracefully in parallel
    with ThreadPoolExecutor(max_workers=2) as ex:
        ex.map(_stop_process, processes)

    # ---- 4. Merge / Remux ----------------------------------------------
    final_path = paths["final"]
    success = False
    
    if combined_url:
        if os.path.exists(paths["combined_tmp"]):
            success = _remux_stream(paths["combined_tmp"], final_path)
            try: os.remove(paths["combined_tmp"])
            except: pass
    else:
        v_exists = os.path.exists(paths["video_tmp"])
        a_exists = os.path.exists(paths["audio_tmp"])
        if v_exists and a_exists:
            success = _merge_streams(paths["video_tmp"], paths["audio_tmp"], final_path)
            # Cleanup
            if success:
                try: 
                    os.remove(paths["video_tmp"])
                    os.remove(paths["audio_tmp"])
                except: pass
        elif v_exists:
            success = _remux_stream(paths["video_tmp"], final_path)
        
    if success and os.path.exists(final_path):
        size_mb = os.path.getsize(final_path) / (1024 * 1024)
        print(f"\n[DONE] Recording saved: {final_path} ({size_mb:.1f} MB)")
        return final_path
    else:
        print("\n[WARN] Failed to finalize MP4 file. Temporary TS files were kept.")
        return output_dir
