# Chaturbate Stream Recorder V2 

A hyper-premium, standalone Desktop Application for recording Chaturbate livestreams seamlessly without frame drops or corruption. 

V2 features a stunning, physics-based **Liquid Glass UI** built with Electron, React, and Framer Motion. Under the hood, it uses our robust Python multi-process backend to solve the classic LL-HLS desync issue.

![Recorder V2 UI](https://github.com/witherstormplaz/CB-Recorder-Public/raw/master/frontend/src/assets/hero.png)

## Why This Exists

Because Chaturbate uses Low Latency HLS (LL-HLS) and serves video and audio as entirely separate streams, traditional `ffmpeg` recording often drops packets, causing jumpy or "fast-forwarding" videos, and broken Audio/Video Sync. 

This tool solves the problem entirely by:
1. Extracting the core URLs via **yt-dlp**.
2. Downloading the video and audio concurrently using **Streamlink** (which is explicitly built for live streaming architectures).
3. Safely merging and perfectly synchronizing the timestamps using a custom `ffmpeg` pipeline only after the stream has safely concluded.

---

## 🚀 1-Click Installation (Windows)

We have packaged the entire application into a single executable so it can be installed and launched instantly.

1. Go to the **Releases** tab.
2. Download `Chaturbate Recorder V2 Setup.exe`.
3. Double-click to install and launch!

*(If you are developing or compiling from source, please see the Advanced Usage section.)*

## Features

- **Liquid Glass Aesthetic:** Dynamic, warm glow aesthetics with real-time physics and mouse-tracking refraction glares.
- **Live Terminal Pipeline:** Real-time stdout logs stream directly from the Python backend into the UI's sliding glass terminal.
- **Flawless A/V Sync:** Safely extracts the internal HLS timestamps to keep audio and video 100% perfectly synced without expensive video re-encoding.
- **Browser Authentication:** Built-in drop-down to extract cookies directly from Chrome, Edge, or Firefox so you can record age-restricted or private streams.

---

## 🛠️ The Standalone Release (No Installation Required!)
We have fully bundled the Python backend (via PyInstaller) and the React UI (via Electron-Builder) into a single, portable executable. 
You do **NOT** need to install Python. You do **NOT** need to install Node.js.

Just download `Chaturbate Recorder V2 Setup.exe` from the Releases page and run it!

---

## CLI Usage (Advanced)

If you prefer to bypass the UI and use the raw backend engine on a headless server, the core python script is still fully accessible.

Basic recording (runs indefinitely until you press `Ctrl+C`):
```bash
python main.py https://chaturbate.com/username/
```

Record for a specific duration (e.g. 60 seconds):
```bash
python main.py https://chaturbate.com/username/ -d 60
```

Record using Browser Cookies:
```bash
python main.py https://chaturbate.com/username/ --cookies-from-browser chrome
```

*(Supported browsers: chrome, firefox, edge, opera, brave, vivaldi, safari)*

---

### Technical Architecture
- **Frontend:** Electron, Vite, React, Tailwind CSS v4, Framer Motion
- **Backend:** Python 3.10, Streamlink, yt-dlp
- **IPC Bridge:** Custom Node `child_process` piping standard POSIX signals and stdin/stdout streams for graceful process termination.
