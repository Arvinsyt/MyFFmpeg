import { ref, onMounted } from 'vue'

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

    function run() {
        if (!inputPath || !inputPath.value) { alert('请选择输入文件'); return }
        if (!outputFolder || !outputFolder.value) { alert('请选择输出文件夹'); return }
        if (!outputFilename || !outputFilename.value) { alert('请输入输出文件名'); return }
        running.value = true
        percent.value = 0
        status.value = '正在转换...'
        try { if (parseOutputFolderInputHandler) parseOutputFolderInputHandler() } catch (e) { }
        const sep = outputFolder.value.includes('/') ? '/' : '\\'
        const folderEnds = outputFolder.value.endsWith('/') || outputFolder.value.endsWith('\\')
        const finalOutput = `${outputFolder.value}${folderEnds ? '' : sep}${outputFilename.value}.${format.value}`
        outputPath.value = finalOutput
        if (!window.electronAPI || !window.electronAPI.runFFmpeg) {
            running.value = false
            status.value = '运行接口不可用'
            return
        }
        window.electronAPI.runFFmpeg({
            input: inputPath.value,
            output: finalOutput,
            videoCodec: videoCodec.value,
            audioCodec: audioCodec.value,
            format: format.value
        }).catch((err) => {
            running.value = false
            status.value = `启动失败: ${err && err.message ? err.message : String(err)}`
        })
    }

    onMounted(() => {
        if (!window.electronAPI) return
        window.electronAPI.onDone((info) => {
            running.value = false
            if (info && info.success) {
                status.value = '转换完成'
                percent.value = 100
            }
            else status.value = `转换结束（代码 ${info && info.code != null ? info.code : 'unknown'}）`
        })
        window.electronAPI.onError((err) => {
            running.value = false
            status.value = `错误: ${err && err.message ? err.message : JSON.stringify(err)}`
        })
        window.electronAPI.onProgress((data) => {
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
