import { messages as msgs } from './messages'

/**
 * 可选的视频编码器配置列表（用于 UI 下拉项）。
 */
export const videoCodecs = [
    { title: msgs.codec_copy, value: 'copy' },
    { title: msgs.codec_libx264, value: 'libx264' },
    { title: msgs.codec_libx265, value: 'libx265' },
    { title: msgs.codec_libvpx_vp9, value: 'libvpx-vp9' },
    { title: msgs.codec_libaom_av1, value: 'libaom-av1' }
]

/**
 * 可选的音频编码器配置列表（用于 UI 下拉项）。
 */
export const audioCodecs = [
    { title: msgs.codec_copy, value: 'copy' },
    { title: msgs.codec_aac, value: 'aac' },
    { title: msgs.codec_libmp3lame, value: 'libmp3lame' },
    { title: msgs.codec_libopus, value: 'libopus' },
    { title: msgs.codec_ac3, value: 'ac3' }
]
