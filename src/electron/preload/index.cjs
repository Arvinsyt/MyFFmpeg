const { contextBridge, ipcRenderer } = require('electron')

/**
 * 预加载脚本：通过 contextBridge 向渲染进程暴露安全的 electron API。
 * 渲染层应通过 window.electronAPI 调用这些方法与订阅事件。
 */
contextBridge.exposeInMainWorld('electronAPI', {
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    runFFmpeg: (opts) => ipcRenderer.invoke('run-ffmpeg', opts),
    getMetadata: (filePath) => ipcRenderer.invoke('probe-video', filePath),
    getFFmpegVersion: () => ipcRenderer.invoke('get-ffmpeg-version'),
    onLog: (cb) => ipcRenderer.on('ffmpeg-log', (event, data) => cb(data)),
    onProgress: (cb) => ipcRenderer.on('ffmpeg-progress', (event, data) => cb(data)),
    onDone: (cb) => ipcRenderer.on('ffmpeg-done', (event, data) => cb(data)),
    onError: (cb) => ipcRenderer.on('ffmpeg-error', (event, data) => cb(data))
})
