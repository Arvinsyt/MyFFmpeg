const path = require('path')
const fs = require('fs')
const logger = require(path.join(__dirname, 'ffmpeg-logger.cjs'))

function createLogWriter() {
    let logStream = null

    function ensureOpen() {
        if (logStream) return logStream
        try {
            const logsDir = logger.ensureLogsDir()
            if (!logsDir) return null
            const logPath = path.join(logsDir, 'ffmpeg-debug.log')
            logStream = fs.createWriteStream(logPath, { flags: 'a' })
            return logStream
        } catch (e) {
            logStream = null
            return null
        }
    }

    return {
        writeErrorLine(line) {
            try {
                const s = ensureOpen()
                if (!s) return
                s.write(`[ERROR] ${new Date().toISOString()} ${String(line || '')}\n`)
            } catch (e) { }
        },
        writeDebug(text) {
            try {
                const s = ensureOpen()
                if (!s) return
                s.write(String(text || '') + '\n')
            } catch (e) { }
        },
        writeErrorBuffer(buf) {
            try {
                const s = ensureOpen()
                if (!s) return
                s.write(`[ERROR-BUFFER] ${new Date().toISOString()}\n`)
                s.write(String(buf || '') + '\n')
            } catch (e) { }
        },
        end() {
            try {
                if (logStream) {
                    try { logStream.end() } catch (e) { }
                    logStream = null
                }
            } catch (e) { }
        }
    }
}

module.exports = { createLogWriter }
