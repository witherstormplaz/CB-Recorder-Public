const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startRecording: (options) => ipcRenderer.send('start-recording', options),
  stopRecording: () => ipcRenderer.send('stop-recording'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  onLog: (callback) => ipcRenderer.on('recording-log', (event, data) => callback(data)),
  onStatus: (callback) => ipcRenderer.on('recording-status', (event, status) => callback(status))
});
