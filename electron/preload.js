
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Open File Dialog
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),

  // Read specific file (for history)
  readFile: (path) => ipcRenderer.invoke('read-file', path),

  // Save content to a specific path
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', { filePath, content }),
  
  // Open a "Save As" dialog to pick a new location
  saveFileAs: (defaultName, content, format) => ipcRenderer.invoke('save-file-as', { defaultName, content, format }),
  
  // Dialogs & Window Management
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  
  // Listeners
  onAppClosing: (callback) => ipcRenderer.on('app-closing', callback),

  // History
  getHistory: () => ipcRenderer.invoke('get-history'),
  addToHistory: (item) => ipcRenderer.invoke('add-to-history', item),
  removeHistoryItems: (paths) => ipcRenderer.invoke('remove-history-items', paths),
  clearHistory: () => ipcRenderer.invoke('clear-history'),

  // Favorites
  getFavorites: () => ipcRenderer.invoke('get-favorites'),
  toggleFavorite: (item) => ipcRenderer.invoke('toggle-favorite', item),

  // Platform info
  platform: process.platform
});
