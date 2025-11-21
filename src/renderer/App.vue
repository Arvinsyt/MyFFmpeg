<script setup>
import { ref, onMounted } from 'vue'

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
  window.electronAPI.runFFmpeg({ input: inputPath.value, output: outputPath.value })
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
</script>

<template>
  <div class="app">
    <header class="app-bar">
      <div class="app-title">MyFFmpeg</div>
    </header>

    <main class="content">
      <section class="card">
        <div class="row">
          <label class="label">输入文件：</label>
          <div style="flex:1;display:flex;align-items:center;gap:8px">
            <input class="input" v-model="inputPath" placeholder="选择输入文件..." readonly />
            <button class="icon-btn" @click="chooseFile" title="选择文件">⋯</button>
          </div>
        </div>

        <div class="row">
          <label class="label">输出格式：</label>
          <select class="select" v-model="format" @change="() => { if (inputPath) { const dot = inputPath.lastIndexOf('.'); const base = dot !== -1 ? inputPath.slice(0, dot) : inputPath; outputPath = `${base}_out.${format}` } }">
            <option value="mp4">mp4</option>
            <option value="mp3">mp3</option>
            <option value="mkv">mkv</option>
          </select>
        </div>

        <div class="row">
          <label class="label">输出文件：</label>
          <input class="input" v-model="outputPath" />
        </div>

        <div class="row actions">
          <button class="btn primary" @click="run" :disabled="running">开始转换</button>
        </div>
      </section>

      <section class="card info" v-if="running || percent !== null || frame !== null">
        <div class="info-row">
          <div class="label">进度</div>
          <div class="progress-inline">
            <template v-if="running">
              <div class="spinner" aria-hidden="true"></div>
              <div class="status-text" style="margin-left:8px">{{ status || '处理中...' }}</div>
            </template>
            <template v-else-if="percent === 100">
              <div class="success" title="完成">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
              <div class="status-text" style="margin-left:8px">完成</div>
            </template>
            <template v-else>
              <div class="waiting">等待中...</div>
            </template>
          </div>
        </div>
        <div class="meta" v-if="frame || fps || totalSize || speed">
          <span v-if="frame">帧: {{ frame }}</span>
          <span v-if="fps"> · FPS: {{ fps.toFixed(1) }}</span>
          <span v-if="totalSize"> · 大小: {{ humanSize(totalSize) }}{{ estFinalSize ? ' / ' + humanSize(estFinalSize) : '' }}</span>
          <span v-if="speed"> · 速度: {{ speed.toFixed(2) }}x</span>
        </div>
      </section>

    </main>
  </div>

    <!-- 调试日志由主进程写入 `logs/ffmpeg-debug.log`（仅记录错误） -->
</template>

<style scoped>
  /* 应用整体与 Material 风格样式 */
  .app{font-family:'Roboto',Arial,Helvetica,sans-serif;color:#202124;background:#f5f7fb;min-height:100vh}
  .app-bar{background:#1a73e8;color:white;padding:14px 20px;box-shadow:0 2px 4px rgba(26,115,232,0.12)}
  .app-title{font-size:18px;font-weight:500}
  .content{max-width:900px;margin:18px auto;padding:0 16px}
  .card{background:white;border-radius:8px;padding:14px;box-shadow:0 1px 3px rgba(60,64,67,0.08);margin-bottom:12px}
  .card.info{padding:10px}
  .row{margin:6px 0;display:flex;align-items:center}
  /* 信息行改为上下排列：标签在上，动画/文字在下（动画与标签间隔 10px） */
  .info-row{display:flex;flex-direction:column;align-items:flex-start}
  .info-row .progress-inline{margin-left:0;margin-top:10px}
  .label{width:86px;color:#5f6368;font-size:14px}
  .input,.select{flex:1;padding:8px 10px;border:1px solid #e0e0e0;border-radius:6px;font-size:14px}
  .input[readonly]{background:#fafafa;border:1px solid #e6e6e6}
  .icon-btn{width:36px;height:36px;border-radius:6px;border:none;background:#f1f3f4;color:#202124;cursor:pointer;font-size:18px;padding:0;display:inline-flex;align-items:center;justify-content:center}
  .icon-btn:hover{background:#e8eaed}
  .btn{padding:8px 12px;border-radius:6px;border:none;background:#e8f0fe;color:#1a73e8;cursor:pointer;box-shadow:none}
  .btn.primary{background:#1a73e8;color:white}
  .btn:disabled{opacity:0.6;cursor:not-allowed}
  .actions{align-items:center}
  /* 进度 spinner（更紧凑） */
  .spinner{width:18px;height:18px;border:3px solid rgba(60,64,67,0.12);border-top-color:#1a73e8;border-radius:50%;animation:spin 1s linear infinite;display:inline-block}
  .progress-inline{display:flex;align-items:center;gap:8px}
  .status-text{font-weight:500;color:#202124;font-size:14px}
  /* 成功动画（绿色勾） */
  .success{width:28px;height:28px;border-radius:50%;background:#188038;display:inline-flex;align-items:center;justify-content:center;animation:pop .36s ease-out}
  @keyframes pop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1);opacity:1}}
  .meta{margin-top:10px;color:#5f6368;font-size:13px}
  @keyframes spin{to{transform:rotate(360deg)}}
</style>