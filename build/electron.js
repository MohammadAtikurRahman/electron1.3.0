const { app, BrowserWindow,Menu } = require('electron');
const path = require('path');

const isDev = process.env.NODE_ENV !== 'production';

let backendProcess;
let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 620,
    show: false, // Don't show the main window until it's ready
    webPreferences: {
      nodeIntegration: true,
    },
  });  
  Menu.setApplicationMenu(null);


  // Load the loading screen first
  win.loadURL(
    isDev
      ? 'http://localhost:3000/loading.html'
      : `file://${path.join(__dirname, '../public/loading.html')}`
  );

  win.once('ready-to-show', () => {
    win.show();
  });

  win.on('close', (event) => {
    event.preventDefault();
    win.minimize();
  });

  // Function to load the main URL
  const loadMainURL = () => {
    win.loadURL(
      isDev
        ? 'http://localhost:3000'
        : `file://${path.join(__dirname, '../build/index.html')}`
    );
  };

  // Load main app after 3 seconds
  setTimeout(loadMainURL, 3000);

  win.webContents.on('did-fail-load', () => {
    console.log('Failed to load, retrying...');
    setTimeout(loadMainURL, 3000); // Retry every 3 seconds
  });
}

app.whenReady().then(() => {
  backendProcess = require('child_process').fork(
    path.join(__dirname, '../backend/server.js'),
    {
      env: { ...process.env, MONGODB_URI: process.env.MONGODB_URI },
    }
  );

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    backendProcess.kill();
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Function to handle app shutdown
function shutdown() {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
}

// This event is emitted when Electron is about to quit.
app.on('before-quit', () => shutdown());

// This event is emitted once, when Electron is quitting.
app.on('will-quit', () => shutdown());

// Handles interrupt signal (SIGINT). For example, Ctrl+C.
process.on('SIGINT', () => {
  console.log('Received SIGINT. Exiting...');
  shutdown();
});

// Handles terminate signal (SIGTERM). For example, kill command.
process.on('SIGTERM', () => {
  console.log('Received SIGTERM. Exiting...');
  shutdown();
});