const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// 获取当前 exe 所在目录
const appPath = path.dirname(process.execPath);

// 设置日志文件夹路径
const logDir = path.join(appPath, 'log');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir); // 如果不存在，创建 log 文件夹
}

// 设置日志文件路径
const logFilePath = path.join(logDir, 'app.log');

// 日志记录函数
function logMessage(message) {
    const logEntry = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logFilePath, logEntry, 'utf8');
}

// 例子：记录应用启动日志
logMessage("应用启动了！");

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
