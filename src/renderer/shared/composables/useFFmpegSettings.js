import { ref, computed } from 'vue'
import { useTheme } from 'vuetify'
import { getFFmpegVersion } from '@/shared/ipc'
import { getSavedTheme, saveTheme } from '@/shared/utils/theme'
import { messages as msgs } from '@/shared/constants/messages'

/**
 * 管理与 FFmpeg/界面设置相关的状态，如主题、设置对话框、以及获取 ffmpeg 版本。
 */
export function useFFmpegSettings() {
    const theme = useTheme()
    const isDark = computed(() => theme.global.name.value === 'dark')

    /** 切换主题并尝试持久化 */
    function toggleTheme() {
        const name = isDark.value ? 'light' : 'dark'
        theme.global.name.value = name
        try { saveTheme(name) } catch (e) { }
    }

    const showSettings = ref(false)
    const ffmpegVersion = ref(msgs.unknown)
    const loadingVersion = ref(false)

    /**
     * 异步获取主进程的 ffmpeg 版本信息并保存到状态中。
     */
    async function fetchFFmpegVersion() {
        try {
            loadingVersion.value = true
            const res = await getFFmpegVersion()
            if (res && res.success) {
                ffmpegVersion.value = res.version || (res.raw ? res.raw.split(/\r?\n/)[0] : msgs.unknown)
            } else {
                ffmpegVersion.value = `${msgs.get_failed_prefix}${res && res.error ? res.error : msgs.unknown}`
            }
        } catch (e) {
            ffmpegVersion.value = `${msgs.error_prefix}${e && e.message ? e.message : String(e)}`
        } finally { loadingVersion.value = false }
    }

    /** 打开设置面板并尝试刷新 ffmpeg 版本 */
    function openSettings() {
        showSettings.value = true
        try { fetchFFmpegVersion() } catch (e) { }
    }

    try {
        const saved = getSavedTheme()
        if (saved) theme.global.name.value = saved
    } catch (e) { }

    return {
        theme,
        isDark,
        toggleTheme,
        showSettings,
        ffmpegVersion,
        loadingVersion,
        fetchFFmpegVersion,
        openSettings
    }
}
