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

We have packaged the entire application so it can be installed and launched instantly without touching a terminal.

1. Install **[Python 3.10+](https://www.python.org/downloads/)** and **[Node.js](https://nodejs.org/)**.
2. Install **[FFmpeg](https://ffmpeg.org/download.html)** and ensure it is added to your system's PATH.
3. Clone this repository or Download the ZIP.
4. Double-click the **`Start.bat`** file.

The script will automatically detect your environment, silently install all necessary Python and React dependencies, and instantly launch the Liquid Glass UI.

## Features

- **Liquid Glass Aesthetic:** Dynamic, warm glow aesthetics with real-time physics and mouse-tracking refraction glares.
- **Live Terminal Pipeline:** Real-time stdout logs stream directly from the Python backend into the UI's sliding glass terminal.
- **Flawless A/V Sync:** Safely extracts the internal HLS timestamps to keep audio and video 100% perfectly synced without expensive video re-encoding.
- **Browser Authentication:** Built-in drop-down to extract cookies directly from Chrome, Edge, or Firefox so you can record age-restricted or private streams.

---

## 🛠️ Upcoming Features
- **Standalone `.exe` Compiler:** We are currently engineering a pipeline using PyInstaller and Electron-Builder to bundle the entire Python/Node ecosystem into a single, portable `.exe` file. Future releases will not require you to install Node or Python at all!

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
