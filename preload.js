const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const targetFile = path.resolve('E:/Yae/test/web_aliya_cosmos/dist/app.asar'); 
async function calculateMD5(filePath) {
  try {
      const fileExists = fs.existsSync(filePath);
      console.log('Preload: Checking if file exists:', fileExists);
      if (!fileExists) {
          console.error('Preload: File not found:', filePath);
          return null;
      }
      const hash = crypto.createHash('md5');
      const stream = fs.createReadStream(filePath);
      for await (const chunk of stream) {
          hash.update(chunk);
      }
      return hash.digest('hex');
  } catch (error) {
      console.error('Preload: Error calculating MD5:', error);
      return null;
  }
}

// 将需要的功能安全地暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  sendQuitRequest: () => ipcRenderer.send('quit-app-on-condition'),
  getAppAsarMD5: () => calculateMD5(targetFile)
  // 如果将来需要其他 IPC 功能，可以在这里添加
});


console.log('Preload script loaded.'); // 添加日志确认 preload 加载
