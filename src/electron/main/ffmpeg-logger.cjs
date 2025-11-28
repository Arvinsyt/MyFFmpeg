const path = require('path')
const fs = require('fs')

function ensureLogsDir() {
    try {
        const logsDir = path.join(__dirname, '..', '..', '..', 'logs')
        fs.mkdirSync(logsDir, { recursive: true })
        return logsDir
    } catch (e) {
        return null
    }
}

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

function writeRunLog(s, level, msg, data) {
    if (!s) return
    try {
        const entry = { t: new Date().toISOString(), level: level || 'info', msg: String(msg || ''), data: data || null }
        s.write(JSON.stringify(entry) + '\n')
    } catch (e) { }
}

module.exports = { ensureLogsDir, openRunLog, writeRunLog }
