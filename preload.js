const { contextBridge, ipcRenderer } = require('electron');

// 将需要的功能安全地暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  sendQuitRequest: () => ipcRenderer.send('quit-app-on-condition'),
  // 如果将来需要其他 IPC 功能，可以在这里添加
});


console.log('Preload script loaded.'); // 添加日志确认 preload 加载
