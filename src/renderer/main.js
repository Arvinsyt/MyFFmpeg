import { createApp } from 'vue'
import App from './App.vue'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

/**
 * 渲染进程入口：创建 Vue 应用并绑定 Vuetify 插件。
 * 该文件负责应用根组件的挂载与主题设置初始化。
 */
const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'light',
        themes: {
            light: {
                colors: {
                    background: '#f5f7fb',
                    surface: '#ffffff',
                    primary: '#1a73e8',
                    'on-primary': '#ffffff',
                    secondary: '#018786',
                    error: '#b00020'
                }
            },
            dark: {
                colors: {
                    background: '#121212',
                    surface: '#1e1e1e',
                    primary: '#90caf9',
                    'on-primary': '#000000',
                    secondary: '#03dac6',
                    error: '#cf6679',
                    'on-surface': '#ffffff',
                    'on-background': '#ffffff'
                }
            }
        }
    }
})

createApp(App).use(vuetify).mount('#app')
