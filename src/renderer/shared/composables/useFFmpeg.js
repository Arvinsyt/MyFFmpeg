import { ref, onMounted } from 'vue'

import { runFFmpeg, onProgress, onDone, onError } from '@/shared/ipc'
import { buildFinalOutput } from '@/shared/utils/format'
import { validateRunInputs } from '@/shared/utils/validators'
import { messages as msgs } from '@/shared/constants/messages'

/**
 * 提供转换任务的主要逻辑：运行 ffmpeg、监听进度/完成/错误事件并维护相关状态。
 * 返回运行状态（running、status、percent 等）和触发 run 的方法。
 */
export function useFFmpeg({ inputPath, outputFolder, outputFilename, format, videoCodec, audioCodec, parseOutputFolderInputHandler } = {}) {
    const running = ref(false)
    const status = ref('')
    const percent = ref(null)
    const frame = ref(null)
    const fps = ref(null)
    const totalSize = ref(null)
    const estFinalSize = ref(null)
    const speed = ref(null)
    const outputPath = ref('')

    /**
     * 开始运行 ffmpeg 的包装方法：先验证输入、准备输出路径、调用主进程接口。
     */
    function run() {
        const v = validateRunInputs(inputPath, outputFolder, outputFilename)
        if (!v.ok) { alert(v.msg || msgs.selectInput); return }
        running.value = true
        percent.value = 0
        status.value = msgs.running
        try { if (parseOutputFolderInputHandler) parseOutputFolderInputHandler() } catch (e) { }
        const finalOutput = buildFinalOutput(outputFolder.value, outputFilename.value, format.value)
        outputPath.value = finalOutput
        runFFmpeg({
            input: inputPath.value,
            output: finalOutput,
            videoCodec: videoCodec.value,
            audioCodec: audioCodec.value,
            format: format.value
        }).catch((err) => {
            running.value = false
            status.value = `${msgs.startup_failed}${err && err.message ? err.message : String(err)}`
        })
    }

    onMounted(() => {
        // ffmpeg 完成事件处理
        onDone((info) => {
            running.value = false
            if (info && info.success) {
                status.value = msgs.done
                percent.value = 100
            }
            else {
                const codeVal = info && info.code != null ? info.code : msgs.unknown
                status.value = msgs.finished_with_code.replace('{code}', String(codeVal))
            }
        })
        // ffmpeg 错误事件处理
        onError((err) => {
            running.value = false
            status.value = `${msgs.error_prefix}${err && err.message ? err.message : JSON.stringify(err)}`
        })
        // ffmpeg 进度事件处理，解析并更新相关统计
        onProgress((data) => {
            if (!data) return
            const kv = data.kv || {}
            if (kv.frame) frame.value = parseInt(kv.frame) || null
            if (kv.fps) fps.value = parseFloat(kv.fps) || null
            if (kv.total_size) totalSize.value = parseInt(kv.total_size) || null
            if (kv.speed) speed.value = parseFloat(String(kv.speed).replace(/x$/, '')) || null

            if (totalSize.value != null && data.outMs != null && data.duration) {
                const elapsed = data.outMs / 1000
                if (elapsed > 0) estFinalSize.value = Math.round(totalSize.value * (data.duration / elapsed))
            }

            if (totalSize.value != null && estFinalSize.value != null && estFinalSize.value > 0) {
                percent.value = Math.min(99, Math.round((totalSize.value / estFinalSize.value) * 100))
            } else if (typeof data.percent === 'number') {
                percent.value = data.percent
            } else if (data.outMs != null && data.duration) {
                percent.value = Math.min(99, Math.round((data.outMs / 1000) / data.duration * 100))
            }
        })
    })

    return { running, status, percent, frame, fps, totalSize, estFinalSize, speed, run, outputPath }
}
