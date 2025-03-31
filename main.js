const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    let win = new BrowserWindow({
        width: 1024,
        height: 800,
        icon: path.join(__dirname, 'QDW.ico'),
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.loadFile('index.html');
}

app.whenReady().then(createWindow);
