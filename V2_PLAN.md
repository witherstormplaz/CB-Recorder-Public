# V2 Architecture Plan: Desktop App with Liquid Glass UI

This document outlines the transition from our **V1** (CLI Python script) to **V2**: a fully-fledged, standalone Desktop Application featuring a state-of-the-art "Liquid Glass" interface. The backend will retain our bulletproof Python recording logic, wrapped in a beautiful, highly interactive frontend.

---

## 1. Core Technology Stack

*   **App Shell:** [Electron](https://www.electronjs.org/)
    *   *Why:* Allows us to package the web interface and the Python backend together into a single, executable desktop application for Windows/Mac/Linux.
*   **Frontend UI:** React (via [Vite](https://vitejs.dev/))
    *   *Why:* Fast development server and industry-standard component architecture.
*   **Aesthetics:** Tailwind CSS + Framer Motion
    *   *Why:* Tailwind provides utility-based styling for complex glass effects, while Framer Motion drives the fluid, physics-based "liquid" animations (springs, drag, smooth transitions).
*   **Backend Core:** Python (V1 `recorder.py`)
    *   *Why:* Retains our highly optimized `yt-dlp` and `streamlink` concurrency logic.

---

## 2. The "Liquid Glass" Aesthetic

Standard "Glassmorphism" uses basic background blurs. **Liquid Glass** elevates this by introducing fluidity, dynamic light, and physics-based interactions.

**Design Pillars:**
1.  **Refractive Translucency:** Using `backdrop-blur-xl` combined with very low opacity backgrounds (`bg-white/5` or `bg-black/10`).
2.  **Dynamic Borders:** Subtle, glowing gradient borders that shift slightly on hover to simulate light bouncing off a curved glass edge.
3.  **Physics-Based Motion:** Using Framer Motion's `spring` physics instead of linear CSS transitions. When clicking a "Record" button, it shouldn't just scale down; it should "squish" and bounce back like a jelly-like physical object.
4.  **Floating Elements:** Cards, inputs, and progress bars will appear to float over a vibrant, slow-moving abstract gradient background.

---

## 3. Communication Bridge (IPC)

To make Electron (Node.js) talk to our Python script seamlessly:

**Approach: Local JSON-RPC via standard I/O**
1.  Electron spawns the Python backend as a child process using `spawn('python', ['backend.py'])`.
2.  The React frontend sends commands (e.g., "START_RECORD", "STOP_RECORD") to Electron via `contextBridge`.
3.  Electron passes these to Python via `stdin`.
4.  Python constantly prints status updates (e.g., `{"status": "downloading", "size_mb": 12.5}`) to `stdout`.
5.  Electron intercepts these and relays them to the React frontend in real-time to update the Liquid Glass progress bars and fluid animations.

---

## 4. Phased Implementation Strategy

### Phase 1: Foundation (The Shell)
*   Initialize a Vite + React + TypeScript project.
*   Install Electron and configure `electron-builder` so it runs natively from the cloned folder (`npm run dev`).
*   Set up Tailwind CSS and Framer Motion.

### Phase 2: Liquid Glass UI Design
*   Create the animated, slow-shifting gradient background.
*   Build the main "Glass Card" component using Tailwind's `backdrop-blur` and border opacities.
*   Design the Input fields (URL, Duration) and the main animated "Record" button using Framer Motion springs.
*   Design a fluid, morphing "Progress/Status" indicator.

### Phase 3: The Python Bridge
*   Refactor `main.py` slightly to accept JSON arguments and output JSON status updates instead of human-readable text.
*   Write the Node.js `child_process` logic in Electron's `main.js` to spawn the Python script.
*   Wire the React state variables to the Python output so the UI reacts instantly to the download speed and status.

### Phase 4: Packaging & Distribution
*   Use `PyInstaller` to freeze the Python environment (including `yt-dlp`, `streamlink`, and `ffmpeg` binaries) into an executable so the end-user *does not need Python installed*.
*   Use `electron-builder` to package the React frontend, the Electron shell, and the frozen Python executable into a single `.exe` installer.

---

## Recovering V1
At any point, the core Python scripts (`recorder.py`) will remain fully functional from the command line. V2 is simply a beautiful wrapper around the exact robust logic we built in V1.
