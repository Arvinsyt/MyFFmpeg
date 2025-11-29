import { ref, computed } from 'vue'
import { computeDisplayItems } from '@/shared/utils/format'
import { getMetadata } from '@/shared/ipc'
import { messages as msgs } from '@/shared/constants/messages'

/**
 * 提供查询媒体元信息（probe）的状态与方法。
 * 返回 infoFile、metadata、probing 等响应式引用和 probeFile 方法。
 */
export function useProbe() {
    const infoFile = ref('')
    const metadata = ref(null)
    const probing = ref(false)
    const showRaw = ref(false)

    const displayItems = computed(() => computeDisplayItems(metadata.value))

    const metadataView = computed({
        get() { return showRaw.value ? 'raw' : 'visual' },
        set(v) { showRaw.value = (v === 'raw') }
    })

    // 设置要查询的文件路径
    function setInfoFile(v) { infoFile.value = v }
    // 切换是否显示原始 JSON 元信息
    function setShowRaw(v) { showRaw.value = v }

    /**
     * 执行元信息查询（调用主进程的 getMetadata），并处理 loading 与结果状态。
     */
    async function probeFile() {
        if (!infoFile.value) return alert(msgs.selectInfoFile)
        probing.value = true
        metadata.value = null
        try {
            const res = await getMetadata(infoFile.value)
            metadata.value = res
        } catch (e) {
            metadata.value = { success: false, error: e && e.message ? e.message : String(e) }
        } finally {
            probing.value = false
        }
    }

    return {
        infoFile,
        metadata,
        probing,
        showRaw,
        displayItems,
        metadataView,
        probeFile,
        setInfoFile,
        setShowRaw
    }
}
