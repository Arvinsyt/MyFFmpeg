const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const logger = require(path.join(__dirname, 'ffmpeg-logger.cjs'))
const progressParser = require(path.join(__dirname, 'ffmpeg-progress-parser.cjs'))
const logWriterFactory = require(path.join(__dirname, 'ffmpeg-log-writer.cjs'))

function register(ipcMain) {
    ipcMain.handle('run-ffmpeg', (event, args) => {
        return new Promise(async (resolve) => {
            const sender = event.sender
            const input = args.input
            const output = args.output
            if (!input || !output) {
                resolve({ success: false, error: 'Invalid input or output' })
                return
            }

            const getDuration = () => {
                return new Promise((res) => {
                    try {
                        const probe = spawn('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', input])
                        let out = ''
                        probe.stdout.on('data', (d) => { out += d.toString() })
                        probe.on('close', (code) => {
                            if (code === 0) {
                                const v = parseFloat(out)
                                if (!isNaN(v) && v > 0) return res(v)
                            }
                            return res(null)
                        })
                        probe.on('error', () => res(null))
                    } catch (e) { res(null) }
                })
            }

            const duration = await getDuration()
            const runId = `${Date.now()}-${process.pid}`
            let runLog = logger.openRunLog(runId, { input, output })
            const logWriter = logWriterFactory.createLogWriter()
            let errorBuffer = ''

            if (duration) {
                event.sender.send('ffmpeg-log', `Detected duration: ${duration} seconds`)
            } else {
                event.sender.send('ffmpeg-log', `Duration unknown (ffprobe failed or not available)`)
            }

            const baseArgs = ['-y', '-i', input].concat(args.extraArgs || [])
            const codecArgs = []
            const fmt = args.format || ''
            if (args.videoCodec && fmt !== 'mp3') {
                codecArgs.push('-c:v', args.videoCodec)
            }
            if (args.audioCodec) {
                codecArgs.push('-c:a', args.audioCodec)
            }

            const ffmpegArgs = ['-hide_banner', '-progress', 'pipe:1', '-nostats']
                .concat(baseArgs)
                .concat(codecArgs)
                .concat([output])

            try { logger.writeRunLog(runLog, 'info', 'ffmpeg-start', { runId, cmd: 'ffmpeg', args: ffmpegArgs }) } catch (e) { }

            const ff = spawn('ffmpeg', ffmpegArgs, { windowsHide: true })

            let stdoutBuffer = ''
            ff.stdout.on('data', (data) => {
                try {
                    const text = data.toString()
                    try { logger.writeRunLog(runLog, 'progress', text.trim()) } catch (e) { }
                    const parsed = progressParser.parseProgressChunk(stdoutBuffer, text, duration)
                    stdoutBuffer = parsed.buffer
                    if (parsed.kv) {
                        sender.send('ffmpeg-progress', { percent: parsed.percent, outMs: parsed.outMs, kv: parsed.kv, duration })
                    }
                } catch (e) { }
            })

            ff.stderr.on('data', (data) => {
                const s = data.toString()
                sender.send('ffmpeg-log', s)
                try {
                    errorBuffer += s
                    logger.writeRunLog(runLog, 'stderr', s)
                    const lines = s.split(/\r?\n/)
                    for (const L of lines) {
                        if (!L) continue
                        if (/error|failed|invalid/i.test(L)) {
                            try { logWriter.writeErrorLine(L) } catch (e) { }
                        }
                    }
                } catch (e) { }
            })

            ff.on('error', (err) => {
                sender.send('ffmpeg-log', `ffmpeg error: ${err.message}`)
                logger.writeRunLog(runLog, 'error', `ffmpeg error: ${err.message}`)
                try { logWriter.writeErrorLine(`ffmpeg error: ${err.message}`) } catch (e) { }
            })

            ff.on('close', (code) => {
                const ok = code === 0
                try {
                    fs.stat(output, (err, stats) => {
                        if (!err && stats && stats.size === 0) {
                            fs.unlink(output, () => {
                                sender.send('ffmpeg-log', `Output file was 0 bytes and has been removed: ${output}`)
                                sender.send('ffmpeg-error', { message: 'Output file is empty (0 bytes). Conversion failed or was interrupted.' })
                                logger.writeRunLog(runLog, 'error', 'output-empty', { output })
                                try { logWriter.writeErrorLine(`Output was 0 bytes, removed: ${output}`) } catch (e) { }
                                sender.send('ffmpeg-done', { code, success: false })
                                try { logWriter.writeDebug(`ffmpeg exit code=${code} success=false`) } catch (e) { }
                                try { logWriter.end() } catch (e) { }
                                try { if (runLog) { logger.writeRunLog(runLog, 'end', 'finished', { code, success: false }); runLog.end() } } catch (e) { }
                                resolve({ success: false, code })
                            })
                        } else {
                            sender.send('ffmpeg-done', { code, success: ok })
                            logger.writeRunLog(runLog, ok ? 'info' : 'error', 'process-exit', { code, success: ok })
                            try {
                                if (!ok || (errorBuffer && errorBuffer.trim())) {
                                    if (errorBuffer && errorBuffer.trim()) {
                                        try { logWriter.writeErrorBuffer(errorBuffer) } catch (e) { }
                                    }
                                    try { logWriter.writeDebug(`ffmpeg exit code=${code} success=${ok}`) } catch (e) { }
                                    try { logWriter.end() } catch (e) { }
                                }
                            } catch (e) { }
                            try { if (runLog) { logger.writeRunLog(runLog, 'end', 'finished', { code, success: ok }); runLog.end() } } catch (e) { }
                            resolve({ success: ok, code })
                        }
                    })
                } catch (e) {
                    sender.send('ffmpeg-done', { code, success: ok })
                    logger.writeRunLog(runLog, 'error', 'stat-check-failed', { code, err: e && e.message ? e.message : String(e) })
                    try { logWriter.writeDebug(`ffmpeg exit code=${code} (stat-check failed)`) } catch (e) { }
                    try { if (runLog) { logger.writeRunLog(runLog, 'end', 'finished-with-exception', { code }); runLog.end() } } catch (e) { }
                    resolve({ success: ok, code })
                }
            })
        })
    })
}

module.exports = { register }
