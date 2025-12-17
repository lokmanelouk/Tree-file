
const { app, BrowserWindow, shell, ipcMain, dialog, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// 1. FIX: Return immediately after quit to stop execution
if (require('electron-squirrel-startup')) {
  app.quit();
  process.exit(0); // Force stop node process immediately
}

let mainWindow;
let splashWindow;
let tray = null;
let isQuitting = false; 

const historyPath = path.join(app.getPath('userData'), 'history.json');
const favoritesPath = path.join(app.getPath('userData'), 'favorites.json');

// Fix icon path for production vs dev
const iconPath = app.isPackaged 
  ? path.join(process.resourcesPath, 'icon.ico') // Production
  : path.join(__dirname, '../resources/icon.ico'); // Dev

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 340,
    height: 380,
    frame: false,
    transparent: true,
    alwaysOnTop: false, // CHANGED: Set to false to allow Alt+Tab
    resizable: false,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

function createWindow() {
  createSplashWindow();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,  // Added minimum width
    minHeight: 600, // Added minimum height
    resizable: true, // Explicitly allow resizing
    title: "Tree File",
    icon: fs.existsSync(iconPath) ? iconPath : undefined, 
    autoHideMenuBar: true,
    frame: true, // Ensure window frame/controls are visible
    show: false,
    webPreferences: {
      nodeIntegration: false, 
      contextIsolation: true, 
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      if (splashWindow && !splashWindow.isDestroyed()) {
        splashWindow.close();
        splashWindow = null;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
      }
    }, 1500);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // 2. FIX: Better Closing Logic
  mainWindow.on('close', (event) => {
      // This lets the window close normally.
      // The 'window-all-closed' event below will then handle quitting the app.
    });
}

function createTray() {
  if (!fs.existsSync(iconPath)) return;

  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    { 
      label: 'Open Tree File', 
      click: () => mainWindow.show() 
    },
    { type: 'separator' },
    { 
      label: 'Quit', 
      click: () => {
        // 3. FIX: Properly trigger the quit sequence
        isQuitting = true;
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('Tree File');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) mainWindow.show();
  });
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // If not on Mac, and user explicitly quit, kill the app
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC HANDLERS ---

ipcMain.handle('open-file-dialog', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Data Files', extensions: ['json', 'yaml', 'yml', 'xml', 'csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (canceled || filePaths.length === 0) return { canceled: true };

  const filePath = filePaths[0];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath);
    return { canceled: false, filePath, content, name };
  } catch (error) {
    return { canceled: true, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-file-as', async (event, { defaultName, content, format }) => {
  let filters = [];
  if (format === 'yaml') filters = [{ name: 'YAML', extensions: ['yaml', 'yml'] }];
  else if (format === 'xml') filters = [{ name: 'XML', extensions: ['xml'] }];
  else if (format === 'csv') filters = [{ name: 'CSV', extensions: ['csv'] }];
  else filters = [{ name: 'JSON', extensions: ['json'] }];
  filters.push({ name: 'All Files', extensions: ['*'] });

  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters
  });

  if (filePath) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true, filePath };
  }
  return { canceled: true };
});

// --- HISTORY & FAVORITES (Kept same logic, just cleaner error handling) ---

ipcMain.handle('get-history', async () => {
  try {
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf-8');
      return JSON.parse(data).sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
    }
    return [];
  } catch (error) { return []; }
});

ipcMain.handle('add-to-history', async (event, item) => {
  try {
    let history = [];
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    }
    let size = 0;
    if (fs.existsSync(item.path)) {
      try { size = fs.statSync(item.path).size; } catch (e) {}
    }
    history = history.filter(h => h.path !== item.path);
    history.unshift({ ...item, size: size, lastOpened: new Date().toISOString() });
    if (history.length > 50) history = history.slice(0, 50);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) { console.error('History error:', error); }
});

ipcMain.handle('remove-history-items', async (event, paths) => {
  try {
    let history = fs.existsSync(historyPath) ? JSON.parse(fs.readFileSync(historyPath, 'utf-8')) : [];
    const newHistory = history.filter(item => !paths.includes(item.path));
    fs.writeFileSync(historyPath, JSON.stringify(newHistory, null, 2), 'utf-8');
    return newHistory;
  } catch (error) { return []; }
});

ipcMain.handle('clear-history', async () => {
  try { fs.writeFileSync(historyPath, '[]', 'utf-8'); } catch (error) {}
});

ipcMain.handle('get-favorites', async () => {
  try {
    if (fs.existsSync(favoritesPath)) return JSON.parse(fs.readFileSync(favoritesPath, 'utf-8'));
    return [];
  } catch (error) { return []; }
});

ipcMain.handle('toggle-favorite', async (event, item) => {
  try {
    let favorites = fs.existsSync(favoritesPath) ? JSON.parse(fs.readFileSync(favoritesPath, 'utf-8')) : [];
    const index = favorites.findIndex(f => f.path === item.path);
    if (index !== -1) favorites.splice(index, 1);
    else favorites.unshift(item);
    fs.writeFileSync(favoritesPath, JSON.stringify(favorites, null, 2), 'utf-8');
    return favorites;
  } catch (error) { return []; }
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize(); // Changed from hide() to minimize() for standard behavior
});

ipcMain.on('quit-app', () => {
  // 4. FIX: Allow renderer to close app completely
  isQuitting = true; 
  app.quit();
});
