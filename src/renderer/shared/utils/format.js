/**
 * 去除字符串两端的引号（单引号或双引号），并去掉首尾空白。
 * @param {string} s
 * @returns {string}
 */
export function stripQuotesStr(s) {
    if (!s) return s
    let t = String(s).trim()
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        t = t.slice(1, -1).trim()
    }
    return t
}

/**
 * 将路径拆分为文件夹、基本名、文件名、扩展名等信息。
 * 支持 Windows 和 POSIX 路径分隔符。
 * @param {string} full
 * @returns {{folder:string,base:string,name:string,ext:string,hasExt:boolean}}
 */
export function splitPath(full) {
    const v = String(full || '')
    const lastSlash = Math.max(v.lastIndexOf('/'), v.lastIndexOf('\\'))
    const base = lastSlash === -1 ? v : v.slice(lastSlash + 1)
    const lastDot = base.lastIndexOf('.')
    if (lastDot > 0) {
        return {
            folder: lastSlash === -1 ? '' : v.slice(0, lastSlash),
            base,
            name: base.slice(0, lastDot),
            ext: base.slice(lastDot + 1),
            hasExt: true
        }
    }
    return {
        folder: lastSlash === -1 ? '' : v.slice(0, lastSlash),
        base,
        name: base,
        ext: '',
        hasExt: false
    }
}

/**
 * 根据输出文件夹、文件名和格式构建最终的输出路径。
 * 自动处理路径分隔符和是否需要插入分隔符。
 */
export function buildFinalOutput(folder, filename, fmt) {
    if (!folder) return `${filename}.${fmt}`
    const sep = folder.includes('/') ? '/' : '\\'
    const folderEnds = folder.endsWith('/') || folder.endsWith('\\')
    return `${folder}${folderEnds ? '' : sep}${filename}.${fmt}`
}

/**
 * 将字节数格式化为可读字符串（KB/MB/GB）。
 * @param {number} bytes
 * @returns {string}
 */
export function humanSize(bytes) {
    if (bytes == null) return ''
    const b = Number(bytes)
    if (isNaN(b)) return ''
    if (b < 1024) return b + ' B'
    const units = ['KB', 'MB', 'GB', 'TB']
    let i = -1
    let val = b
    while (val >= 1024 && i < units.length - 1) {
        val = val / 1024
        i++
    }
    if (i < 0) i = 0
    return val.toFixed(2) + ' ' + units[i]
}

/**
 * 将秒数转换为可读的时分秒文本，例如 1h 2m 3s 或 2m 5s 或 10s。
 * @param {number} sec
 * @returns {string}
 */
export function secsToHMS(sec) {
    if (sec == null || isNaN(Number(sec))) return ''
    const s = Math.floor(Number(sec))
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    if (h > 0) return `${h}h ${m}m ${ss}s`
    if (m > 0) return `${m}m ${ss}s`
    return `${ss}s`
}

import { messages as msgs } from '@/shared/constants/messages'

/**
 * 根据 ffprobe 返回的元信息构建用于界面显示的键值数组。
 * 返回的每项为 {k: label, v: value}，用于信息卡显示。
 * @param {object} metadata - ffprobe 返回的元信息对象
 * @returns {Array<{k:string,v:string}>}
 */
export function computeDisplayItems(metadata) {
    if (!metadata || !metadata.success || !metadata.data) return []
    const d = metadata.data || {}
    const fmt = d.format || {}
    const streams = Array.isArray(d.streams) ? d.streams : []

    const items = []

    if (fmt.format_name) items.push({ k: msgs.format_label_format, v: String(fmt.format_name) })
    if (fmt.duration) items.push({ k: msgs.format_duration, v: secsToHMS(fmt.duration) })
    if (fmt.size) items.push({ k: msgs.format_file_size, v: humanSize(fmt.size) })
    if (fmt.bit_rate) {
        const kb = Math.round(Number(fmt.bit_rate) / 1000)
        items.push({ k: msgs.format_bitrate, v: `${kb} kb/s` })
    }
    const tags = fmt.tags || {}
    if (tags.title) items.push({ k: msgs.tag_title, v: tags.title })
    if (tags.artist) items.push({ k: msgs.tag_artist, v: tags.artist })

    const vstream = streams.find(s => s.codec_type === 'video')
    if (vstream) {
        const res = vstream.width && vstream.height ? `${vstream.width}x${vstream.height}` : ''
        const codec = vstream.codec_name || ''
        const fps = vstream.avg_frame_rate && vstream.avg_frame_rate !== '0/0' ? (function () {
            try { const parts = String(vstream.avg_frame_rate).split('/'); return (Number(parts[0]) / Number(parts[1])) || null } catch (e) { return null }
        })() : null
        const fpsText = fps ? `${Number(fps).toFixed(2)} fps` : ''
        const videoParts = [codec, res, fpsText].filter(x => x)
        if (videoParts.length) items.push({ k: msgs.video_label, v: videoParts.join(' · ') })
    }

    const astream = streams.find(s => s.codec_type === 'audio')
    if (astream) {
        const codec = astream.codec_name || ''
        const sr = astream.sample_rate ? `${astream.sample_rate} Hz` : ''
        const ch = astream.channels ? `${astream.channels}${msgs.channels_suffix}` : ''
        const audioParts = [codec, sr, ch].filter(x => x)
        if (audioParts.length) items.push({ k: msgs.audio_label, v: audioParts.join(' · ') })
    }

    if (streams.length) items.push({ k: msgs.streams_label, v: `${streams.length}` })

    return items
}
