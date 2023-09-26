const { app, BrowserWindow } = require('electron');
const path = require('path');
const express = require('express');
const { spawn } = require('child_process');

const appServer = express();
const PORT = 3000;

let server;

const isDev = require('electron-is-dev');

// If in production, spawn a child process for the server using node_binaries\node.exe
if (!isDev) {
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
  // If in development, just require the server directly
  require('./server');
  require('./routes.js');
}

// Serve static files from the build directory
appServer.use(express.static(path.join(__dirname, 'build')));

// For any GET request, send back the index.html file
appServer.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

appServer.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', function () {
  if (server) server.kill();
  if (process.platform !== 'darwin') app.quit();
});
