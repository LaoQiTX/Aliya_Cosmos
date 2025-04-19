const { app, BrowserWindow, ipcMain } = require('electron'); // 引入 ipcMain
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
            preload: path.join(__dirname, 'preload.js'), // 指定 preload 脚本
            nodeIntegration: true,     
            contextIsolation: true     
        }
    });

    win.loadFile('index.html');
    win.webContents.openDevTools(); // 添加这行来自动打开开发者工具
}

console.log("主进程启动成功");

app.whenReady().then(createWindow);

// 监听来自渲染进程的退出请求
ipcMain.on('quit-app-on-condition', () => {
    logMessage("收到条件退出请求，正在退出应用...");
    console.log("收到条件退出请求，正在退出应用...");
    app.quit();
});
