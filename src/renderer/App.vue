<script setup>
import { ref, onMounted, computed } from 'vue'
import { useTheme } from 'vuetify'

const inputPath = ref('')
const outputPath = ref('')
const format = ref('mp4')
const running = ref(false)
const status = ref('')

// 进度相关信息
// percent: 当前百分比（0-100），frame/fps/totalSize/estFinalSize/speed 用于显示详细状态
const percent = ref(null)
const frame = ref(null)
const fps = ref(null)
const totalSize = ref(null)
const estFinalSize = ref(null)
const speed = ref(null)

// 编解码器选择
const videoCodec = ref('libx264')
const audioCodec = ref('aac')
const videoCodecs = ref([
  { title: '保持不变 (copy)', value: 'copy' },
  { title: 'H.264 (libx264)', value: 'libx264' },
  { title: 'H.265 (libx265)', value: 'libx265' },
  { title: 'VP9 (libvpx-vp9)', value: 'libvpx-vp9' },
  { title: 'AV1 (libaom-av1)', value: 'libaom-av1' }
])
const audioCodecs = ref([
  { title: '保持不变 (copy)', value: 'copy' },
  { title: 'AAC (aac)', value: 'aac' },
  { title: 'MP3 (libmp3lame)', value: 'libmp3lame' },
  { title: 'Opus (libopus)', value: 'libopus' },
  { title: 'AC-3 (ac3)', value: 'ac3' }
])

function chooseFile() {
  if (!window.electronAPI) return
  window.electronAPI.openFile().then((p) => {
    if (p) {
      inputPath.value = p
      const dot = p.lastIndexOf('.')
      const base = dot !== -1 ? p.slice(0, dot) : p
      outputPath.value = `${base}_out.${format.value}`
    }
  })
}

function humanSize(bytes) {
  if (bytes == null) return ''
  const b = Number(bytes)
  if (isNaN(b)) return ''
  if (b < 1024) return b + ' B'
  const units = ['KB','MB','GB','TB']
  let i = -1
  let val = b
  while (val >= 1024 && i < units.length - 1) {
    val = val / 1024
    i++
  }
  if (i < 0) i = 0
  return val.toFixed(2) + ' ' + units[i]
}

function run() {
  if (!inputPath.value) return alert('请选择输入文件')
  if (!outputPath.value) return alert('请选择输出文件')
  running.value = true
  percent.value = 0
  status.value = '正在转换...'
  window.electronAPI.runFFmpeg({
    input: inputPath.value,
    output: outputPath.value,
    videoCodec: videoCodec.value,
    audioCodec: audioCodec.value,
    format: format.value
  })
    .catch((err) => {
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
    // 解析来自主进程的 key=value 数据
    if (kv.frame) frame.value = parseInt(kv.frame) || null
    if (kv.fps) fps.value = parseFloat(kv.fps) || null
    if (kv.total_size) totalSize.value = parseInt(kv.total_size) || null
    if (kv.speed) speed.value = parseFloat(String(kv.speed).replace(/x$/, '')) || null

    // 如果提供了 duration，则估算最终文件大小
    if (totalSize.value != null && data.outMs != null && data.duration) {
      const elapsed = data.outMs / 1000
      if (elapsed > 0) estFinalSize.value = Math.round(totalSize.value * (data.duration / elapsed))
    }

    // 计算百分比：优先使用基于大小的估算，其次使用 data.percent 或时间比率
    if (totalSize.value != null && estFinalSize.value != null && estFinalSize.value > 0) {
      percent.value = Math.min(99, Math.round((totalSize.value / estFinalSize.value) * 100))
    } else if (typeof data.percent === 'number') {
      percent.value = data.percent
    } else if (data.outMs != null && data.duration) {
      percent.value = Math.min(99, Math.round((data.outMs / 1000) / data.duration * 100))
    }

    // 已移除 ETA：界面仅显示 spinner 和百分比
  })
})

// 主题控制（light / dark）
const theme = useTheme()
const isDark = computed(() => theme.global.name.value === 'dark')
function toggleTheme() {
  const name = isDark.value ? 'light' : 'dark'
  theme.global.name.value = name
  try { localStorage.setItem('theme', name) } catch (e) {}
}

// 初始化主题
try {
  const saved = localStorage.getItem('theme')
  if (saved) theme.global.name.value = saved
} catch (e) {}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" dark>
        <v-toolbar-title>MyFFmpeg</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="toggleTheme" title="切换主题">
          <v-icon v-if="isDark">mdi-white-balance-sunny</v-icon>
          <v-icon v-else>mdi-weather-night</v-icon>
        </v-btn>
      </v-app-bar>

    <v-main>
      <v-container class="pa-4" style="max-width:900px">
        <v-card class="pa-4 mb-4">
          <v-row align="center">
            <v-col cols="12" md="3"><div class="label">输入文件：</div></v-col>
            <v-col cols="12" md="9">
              <v-text-field
                v-model="inputPath"
                placeholder="选择输入文件..."
                readonly
                append-inner-icon="mdi-folder-open"
                append-outer-icon="mdi-dots-horizontal"
                @click:append-inner="chooseFile"
                @click:append-outer="chooseFile"
                title="选择文件"
              />
            </v-col>
          </v-row>

          <v-row align="center">
            <v-col cols="12" md="3"><div class="label">输出格式：</div></v-col>
            <v-col cols="12" md="9">
              <v-select v-model="format" :items="['mp4','mp3','mkv']" dense @change="() => { if (inputPath) { const dot = inputPath.lastIndexOf('.'); const base = dot !== -1 ? inputPath.slice(0, dot) : inputPath; outputPath = `${base}_out.${format}` } }"/>
            </v-col>
          </v-row>

          <v-row align="center">
            <v-col cols="12" md="3"><div class="label">视频编码：</div></v-col>
            <v-col cols="12" md="9">
              <v-select
                v-model="videoCodec"
                :items="videoCodecs"
                item-title="title"
                item-value="value"
                dense
                :disabled="format === 'mp3'"
              />
            </v-col>
          </v-row>

          <v-row align="center">
            <v-col cols="12" md="3"><div class="label">音频编码：</div></v-col>
            <v-col cols="12" md="9">
              <v-select
                v-model="audioCodec"
                :items="audioCodecs"
                item-title="title"
                item-value="value"
                dense
              />
            </v-col>
          </v-row>

          <v-row align="center">
            <v-col cols="12" md="3"><div class="label">输出文件：</div></v-col>
            <v-col cols="12" md="9">
              <v-text-field v-model="outputPath"/>
            </v-col>
          </v-row>

          <v-row class="justify-end">
            <v-btn color="primary" :disabled="running" @click="run">开始转换</v-btn>
          </v-row>
        </v-card>

        <v-card v-if="running || percent !== null || frame !== null" class="pa-3">
          <v-row>
            <v-col cols="12">
              <div class="d-flex align-center">
                <template v-if="running">
                  <v-progress-circular indeterminate color="primary" size="20"></v-progress-circular>
                  <div class="status-text ml-3">{{ status || '处理中...' }}</div>
                </template>
                <template v-else-if="percent === 100">
                  <v-icon color="success" size="28">mdi-check-circle</v-icon>
                  <div class="status-text ml-3">完成</div>
                </template>
                <template v-else>
                  <div class="waiting">等待中...</div>
                </template>
              </div>
              <v-progress-linear v-if="percent !== null" :value="percent" class="mt-3"></v-progress-linear>
            </v-col>
          </v-row>
          <v-row class="mt-2">
            <v-col cols="12" class="meta">
              <span v-if="frame">帧: {{ frame }}</span>
              <span v-if="fps"> · FPS: {{ fps.toFixed(1) }}</span>
              <span v-if="totalSize"> · 大小: {{ humanSize(totalSize) }}{{ estFinalSize ? ' / ' + humanSize(estFinalSize) : '' }}</span>
              <span v-if="speed"> · 速度: {{ speed.toFixed(2) }}x</span>
            </v-col>
          </v-row>
        </v-card>

      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
  /* Use Vuetify theme CSS variables so text respects light/dark themes */
  .label{color:var(--v-theme-on-surface);opacity:0.8;font-size:14px}
  .status-text{font-weight:500;color:var(--v-theme-on-surface)}
  .meta{color:var(--v-theme-on-surface);opacity:0.85;font-size:13px}
  .waiting{color:var(--v-theme-on-surface);opacity:0.7}
</style>