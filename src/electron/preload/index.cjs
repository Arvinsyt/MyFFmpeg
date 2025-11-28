const { contextBridge, ipcRenderer } = require('electron')

// 在预加载脚本中暴露安全的 API 到渲染进程（仅包含有限的 IPC 调用）
contextBridge.exposeInMainWorld('electronAPI', {
    // 打开文件对话，返回选中文件路径或 null
    openFile: () => ipcRenderer.invoke('dialog:openFile'),
    // 选择输出文件夹
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    // 启动 ffmpeg 任务（输入/输出等参数）
    runFFmpeg: (opts) => ipcRenderer.invoke('run-ffmpeg', opts),
    // 获取视频/音频元信息（ffprobe 输出 JSON）
    getMetadata: (filePath) => ipcRenderer.invoke('probe-video', filePath),
    // 获取本机 ffmpeg 版本信息
    getFFmpegVersion: () => ipcRenderer.invoke('get-ffmpeg-version'),
    // 订阅来自主进程的日志消息
    onLog: (cb) => ipcRenderer.on('ffmpeg-log', (event, data) => cb(data)),
    // 订阅进度事件 (percent, outMs, kv, duration)
    onProgress: (cb) => ipcRenderer.on('ffmpeg-progress', (event, data) => cb(data)),
    // 订阅转换完成事件
    onDone: (cb) => ipcRenderer.on('ffmpeg-done', (event, data) => cb(data)),
    // 订阅错误事件
    onError: (cb) => ipcRenderer.on('ffmpeg-error', (event, data) => cb(data))
})
