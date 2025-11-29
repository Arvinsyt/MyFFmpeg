import { safeGetItem, safeSetItem } from './storage'

/**
 * 获取保存在本地的主题名（如果存在）。
 * 返回值为字符串或 null。用于组件初始化时恢复主题。
 */
export function getSavedTheme() {
    const v = safeGetItem('theme')
    return v || null
}

/**
 * 将主题名保存到本地存储，不抛出异常。
 * @param {string} name - 主题名称，例如 'light' 或 'dark'
 */
export function saveTheme(name) {
    try { safeSetItem('theme', name) } catch (e) { }
}
