/**
 * 安全地从 localStorage 获取键值，任何异常都返回 null。
 * @param {string} key
 * @returns {string|null}
 */
export function safeGetItem(key) {
    try { return localStorage.getItem(key) } catch (e) { return null }
}

/**
 * 安全地设置 localStorage 的键值，捕获并忽略可能的异常。
 * @param {string} key
 * @param {string} value
 */
export function safeSetItem(key, value) {
    try { localStorage.setItem(key, value) } catch (e) { }
}
