# Chaturbate Stream Recorder

A robust, multi-process python script for recording Chaturbate livestreams seamlessly without frame drops or corruption. 

Because Chaturbate uses Low Latency HLS (LL-HLS) and serves video and audio as entirely separate streams, traditional `ffmpeg` recording often drops packets, causing jumpy or "fast-forwarding" videos. This tool solves the problem by extracting the core URLs via **yt-dlp**, downloading the video and audio concurrently using **Streamlink** (which is explicitly built for live streaming architectures), and only merging them with ffmpeg after the stream has safely concluded.

## Requirements

You must have [ffmpeg](https://ffmpeg.org/download.html) installed and added to your system's PATH.

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/witherstormplaz/chaturbate-stream-recorder.git
   cd chaturbate-stream-recorder
   ```

2. Install the required python packages:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Basic recording (runs indefinitely until you press `Ctrl+C`):
```bash
python main.py https://chaturbate.com/username/
```

Record for a specific duration (e.g. 60 seconds):
```bash
python main.py https://chaturbate.com/username/ -d 60
```

Record to a specific output folder:
```bash
python main.py https://chaturbate.com/username/ -o "D:/my_recordings"
```

### Private / Password-protected Streams
If a stream requires you to be logged into an account with specific permissions, you can instruct the script to use the cookies from your browser session to authenticate:

```bash
python main.py https://chaturbate.com/username/ --cookies-from-browser chrome
```
*(Supported browsers: chrome, firefox, edge, opera, brave, vivaldi, safari)*

Alternatively, if you have a `cookies.txt` file exported via an extension like "Get cookies.txt LOCALLY", you can pass it directly:
```bash
python main.py https://chaturbate.com/username/ -c cookies.txt
```

## How It Works under the hood
1. Queries the target page using `yt-dlp` to uncover the hidden m3u8 playlist URLs for both the raw video and raw audio feeds.
2. Spawns two independent, multi-threaded `streamlink` instances.
3. Streamlink concurrently pulls down raw `.ts` chunks from the server with aggressive retry caching, completely eliminating packet loss.
4. Upon pressing `Ctrl+C` or reaching the time limit, the script cleanly cuts off the background workers and fires an `ffmpeg` command to mux the temporary TS streams into a perfect, standard `.mp4` container.
