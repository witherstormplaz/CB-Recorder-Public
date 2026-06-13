const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let recorderProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    },
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
  });

  mainWindow.setMenu(null);

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

ipcMain.handle('select-directory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

// IPC handlers for Python backend
ipcMain.on('start-recording', (event, options) => {
  if (recorderProcess) return;

  const { url, duration, browser, outputDir } = options;
  
  let exePath;
  let args;

  if (app.isPackaged) {
    // In production, run the bundled PyInstaller backend executable
    exePath = path.join(process.resourcesPath, 'backend.exe');
    // The executable is already unbuffered natively
    args = [url];
  } else {
    // In development, run the python script
    exePath = 'python';
    const scriptPath = path.join(__dirname, '../../main.py');
    // Use -u to force Python into unbuffered mode
    args = ['-u', scriptPath, url];
  }

  // Save recordings into the user-selected directory, or fallback
  const finalOutputDir = outputDir && outputDir.trim() !== ''
    ? outputDir
    : (app.isPackaged ? path.join(app.getPath('documents'), 'ChaturbateRecordings') : path.join(__dirname, '../recordings'));

  args.push('-o', finalOutputDir);
  if (duration && duration.trim() !== '') {
    args.push('--duration', duration);
  }
  if (browser && browser !== 'None' && browser !== '') {
    args.push('--cookies-from-browser', browser);
  }

  mainWindow.webContents.send('recording-status', 'Starting engine...');

  // Spawn python or backend.exe
  recorderProcess = spawn(exePath, args);

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
    // Windows safe IPC shutdown via stdin
    recorderProcess.stdin.write('STOP\n');
  }
});
