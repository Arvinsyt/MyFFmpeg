const path = require('path')
const fs = require('fs')

/**
 * 确保日志目录存在并返回路径，如失败返回 null。
 */
function ensureLogsDir() {
    try {
        const logsDir = path.join(__dirname, '..', '..', '..', 'logs')
        fs.mkdirSync(logsDir, { recursive: true })
        return logsDir
    } catch (e) {
        return null
    }
}

/**
 * 打开用于某次运行的日志写入流（追加模式）。
 * 返回一个 writable stream 或 null。
 */
function openRunLog(runId, meta) {
    const logsDir = ensureLogsDir()
    if (!logsDir) return null
    try {
        const name = `ffmpeg-${runId}.log`
        const p = path.join(logsDir, name)
        const s = fs.createWriteStream(p, { flags: 'a' })
        try { s.write(JSON.stringify({ t: new Date().toISOString(), type: 'run-start', meta }) + '\n') } catch (e) { }
        return s
    } catch (e) { return null }
}

/**
 * 向运行日志写入一条标准化 JSON 条目。
 */
function writeRunLog(s, level, msg, data) {
    if (!s) return
    try {
        const entry = { t: new Date().toISOString(), level: level || 'info', msg: String(msg || ''), data: data || null }
        s.write(JSON.stringify(entry) + '\n')
    } catch (e) { }
}

module.exports = { ensureLogsDir, openRunLog, writeRunLog }
