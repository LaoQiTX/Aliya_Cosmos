const { app, BrowserWindow, ipcMain } = require("electron"); // 引入 ipcMain
// const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
// const asar = require("@electron/asar");
const originalFs = require("original-fs");
const logger = require(path.join(__dirname, 'logger.js'));
console.log(path.join(__dirname, 'logger.js'));

// 获取当前 exe 所在目录
const appPath = path.dirname(process.execPath);
let win;

/**
 * 获取文件的MD5唯一值
 * @param {Stirng} asarPath
 */
function originGetMd5(asarPath) {
  try {
    const data = originalFs.readFileSync(asarPath);
    const md5 = crypto.createHash("md5").update(data).digest("hex");
    logger.info("MD5->" + md5);
  } catch (e) {
    logger.error(e);
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1024,
    height: 900,
    minWidth: 900,
    minHeight: 800,
    icon: path.join(__dirname, "QDW.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // 指定 preload 脚本
      nodeIntegration: true,
      contextIsolation: true,
      // devTools:false
    },
  });
  // win.loadFile(path.join(__dirname, 'page/index.html'));
  if(process.env.NODE_ENV ==='dev'){
    win.loadURL('http://localhost:3000')
  }else{
    win.loadFile(path.join(__dirname, 'page/index.html'));
  }
  // win.loadFile("index.html");
  win.webContents.openDevTools(); // 添加这行来自动打开开发者工具
}


function init(){
  app.whenReady().then(() => {
    logger.info("QDW demo start complete");
    // app.setName("QDW_Demo");
    if (app.isPackaged) {
      const asarPath = path.join(appPath, "resources", "app.asar");
      logger.info("asar->" + asarPath);
      originGetMd5(asarPath);
    }
    createWindow();
    win.on('closed',()=>{
      win = null;
    })
  });
  
  // 监听来自渲染进程的退出请求
  ipcMain.on("quit-app-on-condition", () => {
    logger.info("收到条件退出请求，正在退出应用...");
    app.quit();
  });
  
  ipcMain.handle('get-window-focus', () => {
    if(!win) return false;
    return win.isFocused();
  });
}

init();
