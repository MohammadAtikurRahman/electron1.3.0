const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const express = require('express');
const { spawn } = require('child_process');

const appServer = express();
const PORT = 3000;

let server;
let tray = null;
let mainWindow;

const isDev = require('electron-is-dev');

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });

  if (!isDev) {
    // Set the app to start on login
    app.setLoginItemSettings({
      openAtLogin: true,
      path: app.getPath('exe')
    });

    const serverPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'server.js');
    const nodeBinPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_binaries', 'node.exe');

    server = spawn(nodeBinPath, [serverPath]);

    server.stdout.on('data', (data) => {
      console.log(`server stdout: ${data}`);
    });

    server.stderr.on('data', (data) => {
      console.error(`server stderr: ${data}`);
    });

    server.on('close', (code) => {
      console.log(`server process exited with code ${code}`);
    });
  } else {
    require('./server');
    require('./routes.js');
  }

  appServer.use(express.static(path.join(__dirname, 'build')));
  appServer.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
  appServer.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
  });

  function createWindow() {
    mainWindow = new BrowserWindow({
      width: 1000,
      height: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    mainWindow.loadURL(`http://localhost:${PORT}`);

    mainWindow.on('close', (event) => {
      if (!app.isQuitting) {
        event.preventDefault();
        mainWindow.hide();
      }
      return false;
    });
  }

  app.whenReady().then(() => {
    createWindow();

    const logoTrayPath = isDev
      ? path.join(__dirname, 'logotray.png')
      : path.join(process.resourcesPath, 'app.asar.unpacked', 'logotray.png');

    tray = new Tray(logoTrayPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App', click: () => {
          mainWindow.show();
        }
      },
      {
        label: 'Quit', click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setToolTip('D-Lab');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => {
      mainWindow.show();
    });
  });

  app.on('window-all-closed', function () {
    if (server) server.kill();
    if (process.platform !== 'darwin') app.quit();
  });
}
