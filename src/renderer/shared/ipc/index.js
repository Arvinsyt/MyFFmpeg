/**
 * 在渲染进程中封装对 preload 暴露的 electronAPI 的调用，提供安全的调用入口。
 */
export async function openFile() {
    if (!window.electronAPI || !window.electronAPI.openFile) return null
    try { return await window.electronAPI.openFile() } catch (e) { return null }
}

/**
 * 打开目录选择对话并返回所选目录路径或 null。
 */
export async function openDirectory() {
    if (!window.electronAPI || !window.electronAPI.openDirectory) return null
    try { return await window.electronAPI.openDirectory() } catch (e) { return null }
}

/**
 * 向主进程请求运行 ffmpeg，传入参数对象。
 */
export async function runFFmpeg(opts) {
    if (!window.electronAPI || !window.electronAPI.runFFmpeg) throw new Error('runFFmpeg not available')
    return window.electronAPI.runFFmpeg(opts)
}

/**
 * 请求获取媒体元信息（ffprobe），返回类似 {success: boolean, data|error}
 */
export async function getMetadata(filePath) {
    if (!window.electronAPI || !window.electronAPI.getMetadata) return { success: false, error: 'not_available' }
    return window.electronAPI.getMetadata(filePath)
}

/**
 * 请求获取本机 ffmpeg 版本信息。
 */
export async function getFFmpegVersion() {
    if (!window.electronAPI || !window.electronAPI.getFFmpegVersion) return { success: false, error: 'not_available' }
    return window.electronAPI.getFFmpegVersion()
}

/**
 * 绑定日志事件回调（来自主进程的 ffmpeg 日志）。返回注销函数。
 */
export function onLog(cb) {
    if (!window.electronAPI || !window.electronAPI.onLog) return () => { }
    try { window.electronAPI.onLog(cb) } catch (e) { }
    return () => { }
}

/**
 * 绑定进度事件回调（来自主进程的 ffmpeg 进度信息）。返回注销函数。
 */
export function onProgress(cb) {
    if (!window.electronAPI || !window.electronAPI.onProgress) return () => { }
    try { window.electronAPI.onProgress(cb) } catch (e) { }
    return () => { }
}

/**
 * 绑定完成事件回调（ffmpeg 完成或退出）。返回注销函数。
 */
export function onDone(cb) {
    if (!window.electronAPI || !window.electronAPI.onDone) return () => { }
    try { window.electronAPI.onDone(cb) } catch (e) { }
    return () => { }
}

/**
 * 绑定错误事件回调（ffmpeg 运行错误）。返回注销函数。
 */
export function onError(cb) {
    if (!window.electronAPI || !window.electronAPI.onError) return () => { }
    try { window.electronAPI.onError(cb) } catch (e) { }
    return () => { }
}
