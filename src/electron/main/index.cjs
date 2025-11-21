const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')

function createWindow() {
    const win = new BrowserWindow({
        width: 900,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, '..', 'preload', 'index.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev) {
        win.loadURL('http://localhost:5173')
    } else {
        win.loadFile(path.join(__dirname, '..', '..', '..', 'dist', 'index.html'))
    }
}

app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// 打开文件对话
ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openFile'] })
    if (canceled || filePaths.length === 0) return null
    return filePaths[0]
})

// 通过 spawn 运行 ffmpeg，并将日志回传给渲染进程
ipcMain.handle('run-ffmpeg', (event, args) => {
    return new Promise(async (resolve) => {
        const sender = event.sender
        const input = args.input
        const output = args.output
        if (!input || !output) {
            resolve({ success: false, error: 'Invalid input or output' })
            return
        }

        // 辅助函数：尝试通过 ffprobe 获取时长（秒），若失败返回 null
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
        // 仅在发生错误时写入调试日志：收集 stderr 中可能的错误信息，并在错误或退出时写入
        let logStream = null
        let errorBuffer = ''
        const maybeOpenLog = () => {
            if (logStream) return
            try {
                const logsDir = path.join(__dirname, '..', '..', '..', 'logs')
                fs.mkdirSync(logsDir, { recursive: true })
                const logPath = path.join(logsDir, 'ffmpeg-debug.log')
                logStream = fs.createWriteStream(logPath, { flags: 'a' })
            } catch (e) {
                logStream = null
            }
        }
        // 通知渲染进程检测到的时长（UI 使用进度事件）
        if (duration) {
            event.sender.send('ffmpeg-log', `Detected duration: ${duration} seconds`)
        } else {
            event.sender.send('ffmpeg-log', `Duration unknown (ffprobe failed or not available)`)
        }

        // 使用 ffmpeg 的 -progress 从 stdout 获取可解析的进度信息
        const baseArgs = ['-y', '-i', input].concat(args.extraArgs || [])
        const ffmpegArgs = ['-hide_banner', '-progress', 'pipe:1', '-nostats'].concat(baseArgs).concat([output])

        const ff = spawn('ffmpeg', ffmpegArgs, { windowsHide: true })

        // 从 stdout 解析进度信息（key=value 格式的行）
        let stdoutBuffer = ''
        ff.stdout.on('data', (data) => {
            const text = data.toString()
            // Do not write normal stdout progress to log file; progress is sent via IPC.
            // 不要把正常的 stdout 进度写入日志文件；进度通过 IPC 发回给渲染进程显示
            stdoutBuffer += text
            const lines = stdoutBuffer.split(/\r?\n/)
            // keep last partial line in buffer
            // 保留最后未完成的那一行在缓冲区
            if (!stdoutBuffer.endsWith('\n') && !stdoutBuffer.endsWith('\r')) {
                stdoutBuffer = lines.pop() || ''
            } else {
                stdoutBuffer = ''
            }

            const kv = {}
            for (const line of lines) {
                const idx = line.indexOf('=')
                if (idx === -1) continue
                const key = line.slice(0, idx).trim()
                const val = line.slice(idx + 1).trim()
                kv[key] = val
            }

            if (Object.keys(kv).length > 0) {
                // out_time_ms 提供以毫秒为单位的进度时间
                let outMs = null
                if (kv.out_time_ms) outMs = parseInt(kv.out_time_ms)
                else if (kv.out_time) {
                    // parse HH:MM:SS.micro
                    const parts = kv.out_time.split(':')
                    if (parts.length === 3) {
                        const hh = parseFloat(parts[0]) || 0
                        const mm = parseFloat(parts[1]) || 0
                        const ss = parseFloat(parts[2]) || 0
                        outMs = Math.floor((hh * 3600 + mm * 60 + ss) * 1000)
                    }
                }

                let percent = null
                if (duration && outMs != null) {
                    // 计算百分比，但不从进度流发送 100%；保留 100% 在进程 close 时处理
                    percent = Math.min(99, Math.round((outMs / 1000) / duration * 100))
                }

                // 如果 ffmpeg 报告 progress=end，不要立即标记为 100%；等待 close 事件来设置最终状态
                if (kv.progress && kv.progress === 'end') {
                    if (percent === null) percent = 99
                }

                sender.send('ffmpeg-progress', { percent, outMs, kv, duration })
            }
        })

        ff.stderr.on('data', (data) => {
            const s = data.toString()
            // 将 stderr 转发到渲染进程作为日志（供 UI 可选显示）
            sender.send('ffmpeg-log', s)
            // 仅收集并写入真正像错误的行到调试日志
            try {
                errorBuffer += s
                // 检测看起来像错误/失败的行
                const lines = s.split(/\r?\n/)
                for (const L of lines) {
                    if (!L) continue
                    if (/error|failed|invalid/i.test(L)) {
                        maybeOpenLog()
                        if (logStream) {
                            try { logStream.write(`[ERROR] ${new Date().toISOString()} ${L}\n`) } catch (e) { }
                        }
                    }
                }
            } catch (e) { }
        })

        ff.on('error', (err) => {
            sender.send('ffmpeg-log', `ffmpeg error: ${err.message}`)
            try {
                maybeOpenLog()
                if (logStream) logStream.write(`[EXCEPTION] ${new Date().toISOString()} ffmpeg error: ${err.message}\n`)
            } catch (e) { }
        })

        ff.on('close', (code) => {
            const ok = code === 0
            // 进程退出后检查输出文件大小；如果为 0 字节则删除并报告错误
            try {
                fs.stat(output, (err, stats) => {
                    if (!err && stats && stats.size === 0) {
                        // 删除零字节文件
                        fs.unlink(output, () => {
                            sender.send('ffmpeg-log', `Output file was 0 bytes and has been removed: ${output}`)
                            sender.send('ffmpeg-error', { message: 'Output file is empty (0 bytes). Conversion failed or was interrupted.' })
                            try { maybeOpenLog(); if (logStream) logStream.write(`[ERROR] ${new Date().toISOString()} Output was 0 bytes, removed: ${output}\n`) } catch (e) { }
                            sender.send('ffmpeg-done', { code, success: false })
                            try { if (logStream) { logStream.write(`ffmpeg exit code=${code} success=false\n`); logStream.end() } } catch (e) { }
                            resolve({ success: false, code })
                        })
                    } else {
                        sender.send('ffmpeg-done', { code, success: ok })
                        // 如果非零退出或收集到错误信息，则写入日志
                        try {
                            if (!ok || (errorBuffer && errorBuffer.trim())) {
                                maybeOpenLog()
                                if (logStream) {
                                    if (errorBuffer && errorBuffer.trim()) {
                                        logStream.write(`[ERROR-BUFFER] ${new Date().toISOString()}\n`)
                                        logStream.write(errorBuffer + '\n')
                                    }
                                    logStream.write(`ffmpeg exit code=${code} success=${ok}\n`)
                                    logStream.end()
                                }
                            }
                        } catch (e) { }
                        resolve({ success: ok, code })
                    }
                })
            } catch (e) {
                sender.send('ffmpeg-done', { code, success: ok })
                try { maybeOpenLog(); if (logStream) { logStream.write(`ffmpeg exit code=${code} (stat-check failed)\n`); logStream.end() } } catch (e) { }
                resolve({ success: ok, code })
            }
        })
    })
})
