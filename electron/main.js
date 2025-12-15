const { app, BrowserWindow, shell, ipcMain, dialog, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let splashWindow;
let tray = null;
let isQuitting = false; // Flag to determine if user really wants to quit

const historyPath = path.join(app.getPath('userData'), 'history.json');
const favoritesPath = path.join(app.getPath('userData'), 'favorites.json');

// Define the icon path (assuming resources/icon.ico exists relative to the project root)
// When running from 'electron/', resources is one level up.
const iconPath = path.join(__dirname, '../resources/icon.ico');

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 340,
    height: 380,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    // ADD THIS LINE: This forces the window itself to be invisible
    backgroundColor: '#00000000', 
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
  // Show Splash Screen first
  createSplashWindow();

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Tree File",
    icon: fs.existsSync(iconPath) ? iconPath : undefined, 
    autoHideMenuBar: true,
    show: false, // Hide initially until content is ready
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

  // Event: Main Window Ready
  mainWindow.once('ready-to-show', () => {
    // Wait a brief moment to show off the splash screen logic or let React hydrate
    setTimeout(() => {
      if (splashWindow) {
        splashWindow.close();
        splashWindow = null;
      }
      mainWindow.show();
      mainWindow.focus();
    }, 1500); // 1.5s delay for effect
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    mainWindow.webContents.send('app-closing');
  });
}

function createTray() {
  if (!fs.existsSync(iconPath)) {
    return;
  }

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
        isQuitting = true;
        app.quit();
      } 
    }
  ]);
  
  tray.setToolTip('Tree File');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    mainWindow.show();
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
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// --- IPC HANDLERS ---

// 1. OPEN FILE DIALOG
ipcMain.handle('open-file-dialog', async (event) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Data Files', extensions: ['json', 'yaml', 'yml', 'xml', 'csv'] },
      { name: 'JSON', extensions: ['json'] },
      { name: 'YAML', extensions: ['yaml', 'yml'] },
      { name: 'XML', extensions: ['xml'] },
      { name: 'CSV', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (canceled || filePaths.length === 0) {
    return { canceled: true };
  }

  const filePath = filePaths[0];
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(filePath);
    return { canceled: false, filePath, content, name };
  } catch (error) {
    return { canceled: true, error: error.message };
  }
});

// 2. READ SPECIFIC FILE (For History)
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 3. SAVE FILE
ipcMain.handle('save-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// 4. SAVE AS DIALOG
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

// 5. HISTORY HANDLERS
ipcMain.handle('get-history', async () => {
  try {
    if (fs.existsSync(historyPath)) {
      const data = fs.readFileSync(historyPath, 'utf-8');
      const history = JSON.parse(data);
      // Sort by lastOpened descending
      return history.sort((a, b) => new Date(b.lastOpened) - new Date(a.lastOpened));
    }
    return [];
  } catch (error) {
    return [];
  }
});

ipcMain.handle('add-to-history', async (event, item) => {
  try {
    let history = [];
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    }

    // Update File Size Logic
    let size = 0;
    if (fs.existsSync(item.path)) {
      try {
        const stats = fs.statSync(item.path);
        size = stats.size;
      } catch (e) {
        console.error("Could not read file stats", e);
      }
    }

    // Remove existing entry for this path if it exists
    history = history.filter(h => h.path !== item.path);

    // Add new item to top
    history.unshift({
      ...item,
      size: size, // Store size
      lastOpened: new Date().toISOString()
    });

    // Limit history size (e.g., 50 items)
    if (history.length > 50) {
      history = history.slice(0, 50);
    }

    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to update history:', error);
  }
});

ipcMain.handle('remove-history-items', async (event, paths) => {
  try {
    let history = [];
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
    }

    const newHistory = history.filter(item => !paths.includes(item.path));
    fs.writeFileSync(historyPath, JSON.stringify(newHistory, null, 2), 'utf-8');
    return newHistory;
  } catch (error) {
    console.error('Failed to remove items from history:', error);
    return [];
  }
});

ipcMain.handle('clear-history', async () => {
  try {
    fs.writeFileSync(historyPath, JSON.stringify([], null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to clear history:', error);
  }
});

// 6. FAVORITES HANDLERS
ipcMain.handle('get-favorites', async () => {
  try {
    if (fs.existsSync(favoritesPath)) {
      return JSON.parse(fs.readFileSync(favoritesPath, 'utf-8'));
    }
    return [];
  } catch (error) {
    return [];
  }
});

ipcMain.handle('toggle-favorite', async (event, item) => {
  try {
    let favorites = [];
    if (fs.existsSync(favoritesPath)) {
      favorites = JSON.parse(fs.readFileSync(favoritesPath, 'utf-8'));
    }

    const index = favorites.findIndex(f => f.path === item.path);
    if (index !== -1) {
      // Remove
      favorites.splice(index, 1);
    } else {
      // Add
      favorites.unshift(item);
    }

    fs.writeFileSync(favoritesPath, JSON.stringify(favorites, null, 2), 'utf-8');
    return favorites;
  } catch (error) {
    console.error('Failed to toggle favorite:', error);
    return [];
  }
});

ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.hide();
});
