const { app, BrowserWindow, ipcMain } = require('electron'); // 引入 ipcMain
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
// const asar = require('@electron/asar');
const originalFs = require('original-fs');


// 获取当前 exe 所在目录
const appPath = path.dirname(process.execPath);

// 设置日志文件夹路径
const logDir = path.join(appPath, 'log');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir); // 如果不存在，创建 log 文件夹
}

// 设置日志文件路径
const logFilePath = path.join(logDir, 'app.log');
const targetFile = path.resolve('E:/Yae/test/web_aliya_cosmos/dist/js.asar');

/**
 * 日志记录函数
 *  
 */ 
function logMessage(message) {
    const formatter = new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Shanghai'
    });

    const nowStr = formatter.format(new Date()).replace(/\//g, '-');
    const logEntry = `[${nowStr}] ${message}\n`;
    fs.appendFileSync(logFilePath, logEntry, 'utf8');
    console.log(message);
}

// 弃用
async function calculateExternalAsarMD5(asarPath) {
    try {
        // 获取文件列表
        const fileList = asar.listPackage(asarPath);
        console.log('File list from asar.listPackage:', fileList);

        const hash = crypto.createHash('md5');

        // 遍历文件列表，处理每个文件
        for (const entryName of fileList) {
            try {
                // 获取文件信息
                const fixedEntryName = entryName.replace(/\\/g, '/');
                const entry = asar.statFile(asarPath, fixedEntryName);
                if (entry && entry.type === 'file') {
                    // 提取文件内容
                    const content = asar.extractFile(asarPath, entryName);
                    console.log(`Extracted file: ${entryName}, size: ${entry.size}, type: ${typeof content}`);

                    // 更新 MD5
                    if (content instanceof Buffer) {
                        hash.update(content);
                    } else if (typeof content === 'string') {
                        hash.update(content, 'utf8');
                    } else {
                        console.warn(`Warning: Unexpected content type for ${entryName}: ${typeof content}`);
                    }
                } else {
                    console.log(`Skipping directory or special entry: ${entryName}, type: ${entry ? entry.type : 'unknown'}`);
                }
            } catch (extractError) {
                console.error(`Error processing entry ${entryName}:`, extractError);
                // 忽略提取错误，继续处理其他条目
            }
        }
        return hash.digest('hex');
    } catch (error) {
        console.error('Error calculating MD5 of external asar:', error);
        return null;
    }
}

function originGetMd5(asarPath){
    const data = originalFs.readFileSync(asarPath);
    const md5 = crypto.createHash('md5').update(data).digest('hex');
    console.log('MD5:', md5);
}


// 例子：记录应用启动日志
logMessage("QDW demo start complete");

function createWindow() {
    let win = new BrowserWindow({
        width: 1024,
        height: 900,
        minWidth: 900,
        minHeight: 800,
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

// app.whenReady().then(createWindow);
app.whenReady().then(()=>{
    // originGetMd5(targetFile);
    createWindow();
    // calculateExternalAsarMD5(targetFile).then((md5) => {
    //     console.log('Asar hash:', md5);
    // });
})

// 监听来自渲染进程的退出请求
ipcMain.on('quit-app-on-condition', () => {
    logMessage("收到条件退出请求，正在退出应用...");
    console.log("收到条件退出请求，正在退出应用...");
    app.quit();
});
