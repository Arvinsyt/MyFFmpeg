/**
 * 封装工具栏动作的 composable（只在渲染层提供简单的包装）。
 * @param {{onOpenSettings:Function,onToggleTheme:Function}} props
 */
export function useToolbarActions(props) {
    // 打开设置对话框的触发函数
    function openSettings() { props.onOpenSettings && props.onOpenSettings() }
    // 切换主题的触发函数
    function toggleTheme() { props.onToggleTheme && props.onToggleTheme() }

    return {
        openSettings,
        toggleTheme
    }
}
