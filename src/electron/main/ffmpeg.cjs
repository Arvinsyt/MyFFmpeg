const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const logger = require(path.join(__dirname, 'ffmpeg-logger.cjs'))

/**
 * 注册与 ffprobe / ffmpeg 相关的 ipc 处理器：提供媒体探测与版本查询接口。
 * 会尝试加载并注册更复杂的运行器（ffmpeg-runner）。
 */
function register(ipcMain) {
    ipcMain.handle('probe-video', async (event, filePath) => {
        return new Promise((res) => {
            if (!filePath) return res({ success: false, error: 'no file' })
            try {
                const args = ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', filePath]
                const p = spawn('ffprobe', args)
                let out = ''
                let err = ''
                p.stdout.on('data', (d) => { out += d.toString() })
                p.stderr.on('data', (d) => { err += d.toString() })
                p.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const json = JSON.parse(out || '{}')
                            return res({ success: true, data: json })
                        } catch (e) {
                            try {
                                const logsDir = logger.ensureLogsDir()
                                if (logsDir) fs.appendFileSync(path.join(logsDir, 'ffprobe-errors.log'), `${new Date().toISOString()} parse_failed ${filePath}\nraw:${out}\nerr:${err}\n`)
                            } catch (ee) { }
                            return res({ success: false, error: 'parse_failed', raw: out })
                        }
                    }
                    try {
                        const logsDir = logger.ensureLogsDir()
                        if (logsDir) fs.appendFileSync(path.join(logsDir, 'ffprobe-errors.log'), `${new Date().toISOString()} ffprobe_failed code=${code} file=${filePath}\nstderr:${err}\n`)
                    } catch (ee) { }
                    return res({ success: false, error: 'ffprobe_failed', code, stderr: err })
                })
                p.on('error', (e) => res({ success: false, error: e && e.message ? e.message : String(e) }))
            } catch (e) { res({ success: false, error: e && e.message ? e.message : String(e) }) }
        })
    })

    ipcMain.handle('get-ffmpeg-version', async () => {
        return new Promise((res) => {
            try {
                const p = spawn('ffmpeg', ['-version'])
                let out = ''
                let err = ''
                p.stdout.on('data', (d) => { out += d.toString() })
                p.stderr.on('data', (d) => { err += d.toString() })
                p.on('close', (code) => {
                    if (code === 0 && out) {
                        const first = out.split(/\r?\n/)[0] || out
                        return res({ success: true, version: first, raw: out })
                    }
                    try { const logsDir = logger.ensureLogsDir(); if (logsDir) fs.appendFileSync(path.join(logsDir, 'ffmpeg-errors.log'), `${new Date().toISOString()} ffmpeg_version_failed code=${code}\nstderr:${err}\n`) } catch (e) { }
                    return res({ success: false, error: 'ffmpeg_not_found_or_failed', code, stderr: err })
                })
                p.on('error', (e) => res({ success: false, error: e && e.message ? e.message : String(e) }))
            } catch (e) { res({ success: false, error: e && e.message ? e.message : String(e) }) }
        })
    })

    try {
        const runner = require(path.join(__dirname, 'ffmpeg-runner.cjs'))
        if (runner && typeof runner.register === 'function') runner.register(ipcMain)
    } catch (e) { console.error('Failed to load ffmpeg-runner:', e && e.message ? e.message : e) }
}

module.exports = { register }
