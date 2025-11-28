function parseProgressChunk(buffered, chunk, duration) {
    const text = (buffered || '') + String(chunk || '')
    const lines = text.split(/\r?\n/)
    let newBuffer = ''
    if (lines.length > 0 && lines[lines.length - 1] !== '') {
        newBuffer = lines.pop()
    }

    const kv = {}
    for (const line of lines) {
        if (!line) continue
        const idx = line.indexOf('=')
        if (idx === -1) continue
        const key = line.slice(0, idx).trim()
        const val = line.slice(idx + 1).trim()
        kv[key] = val
    }

    let outMs = null
    if (kv.out_time_ms) outMs = parseInt(kv.out_time_ms)
    else if (kv.out_time) {
        const parts = kv.out_time.split(':')
        if (parts.length === 3) {
            const hh = parseFloat(parts[0]) || 0
            const mm = parseFloat(parts[1]) || 0
            const ss = parseFloat(parts[2]) || 0
            outMs = Math.floor((hh * 3600 + mm * 60 + ss) * 1000)
        }
    }

    let percent = null
    try {
        if (duration && outMs != null) {
            percent = Math.min(99, Math.round((outMs / 1000) / duration * 100))
        }
        if (kv.progress && kv.progress === 'end') {
            if (percent === null) percent = 99
        }
    } catch (e) { percent = null }

    return { buffer: newBuffer, kv: Object.keys(kv).length ? kv : null, outMs, percent }
}

module.exports = { parseProgressChunk }
