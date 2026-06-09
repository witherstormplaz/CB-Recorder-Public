const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let recorderProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
  });

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers for Python backend
ipcMain.on('start-recording', (event, options) => {
  if (recorderProcess) return;

  const { url, duration, browser } = options;
  // Pointing to main.py one level up from frontend folder
  const scriptPath = path.join(__dirname, '../../main.py');
  
  const args = [scriptPath, url];
  if (duration && duration.trim() !== '') {
    args.push('--duration', duration);
  }
  if (browser && browser !== 'None' && browser !== '') {
    args.push('--cookies-from-browser', browser);
  }

  mainWindow.webContents.send('recording-status', 'Starting engine...');

  // Spawn python
  recorderProcess = spawn('python', args);

  recorderProcess.stdout.on('data', (data) => {
    if (mainWindow) {
      mainWindow.webContents.send('recording-log', data.toString());
    }
  });

  recorderProcess.stderr.on('data', (data) => {
    if (mainWindow) {
      // Streamlink outputs logs to stderr usually
      mainWindow.webContents.send('recording-log', data.toString());
    }
  });

  recorderProcess.on('close', (code) => {
    recorderProcess = null;
    if (mainWindow) {
      mainWindow.webContents.send('recording-status', 'Idle');
      mainWindow.webContents.send('recording-log', `[system] Process exited with code ${code}`);
    }
  });
});

ipcMain.on('stop-recording', () => {
  if (recorderProcess) {
    if (mainWindow) {
      mainWindow.webContents.send('recording-status', 'Stopping gracefully...');
      mainWindow.webContents.send('recording-log', '[system] Sending kill signal to finalize files...');
    }
    // Graceful stop using SIGTERM (we added handler in main.py)
    recorderProcess.kill('SIGTERM');
  }
});
