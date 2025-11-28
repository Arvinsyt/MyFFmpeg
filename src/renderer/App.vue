<script setup>
import { ref, computed, defineAsyncComponent } from 'vue'
import { useTheme } from 'vuetify'
import { computeDisplayItems } from '@/utils/format'
import { chooseFile, chooseOutputFolder, parseOutputFolderInput, parseInputPathInput, chooseInfoFile, parseInfoFileInput } from '@/utils/app-helpers'

const InfoTab = defineAsyncComponent(() => import('./components/InfoTab.vue'))
const ConvertTab = defineAsyncComponent(() => import('./components/ConvertTab.vue'))
const ToolbarActions = defineAsyncComponent(() => import('./components/ToolbarActions.vue'))
const SettingsDialogContent = defineAsyncComponent(() => import('./components/SettingsDialogContent.vue'))

function setInfoFile(v) { infoFile.value = v }
function setShowRaw(v) { showRaw.value = v }
function setInputPath(v) { inputPath.value = v }
function setOutputFolder(v) { outputFolder.value = v }
function setOutputFilename(v) { outputFilename.value = v }
function setFormat(v) { format.value = v }
function setVideoCodec(v) { videoCodec.value = v }
function setAudioCodec(v) { audioCodec.value = v }
const chooseFileHandler = () => chooseFile(inputPath, outputFolder, outputFilename)
const chooseOutputFolderHandler = () => chooseOutputFolder(outputFolder)
const parseOutputFolderInputHandler = () => parseOutputFolderInput(outputFolder, outputFilename)
const parseInputPathInputHandler = () => parseInputPathInput(inputPath, outputFolder, outputFilename)
const chooseInfoFileHandler = () => chooseInfoFile(infoFile)
const parseInfoFileInputHandler = () => parseInfoFileInput(infoFile)

const selectedTab = ref(0)

const infoFile = ref('')
const metadata = ref(null)
const probing = ref(false)
const showRaw = ref(false)
const showSettings = ref(false)
const ffmpegVersion = ref('未知')
const loadingVersion = ref(false)

 

async function probeFile() {
  if (!infoFile.value) return alert('请选择要查询的文件')
  if (!window.electronAPI || !window.electronAPI.getMetadata) return alert('元信息功能不可用')
  probing.value = true
  metadata.value = null
  try {
    const res = await window.electronAPI.getMetadata(infoFile.value)
    metadata.value = res
  } catch (e) {
    metadata.value = { success: false, error: e && e.message ? e.message : String(e) }
  } finally { probing.value = false }
}

const inputPath = ref('')
const outputFolder = ref('')
const outputFilename = ref('output')
const format = ref('mp4')

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

import { useFFmpeg } from '@/composables/useFFmpeg'
const { running, status, percent, frame, fps, totalSize, estFinalSize, speed, run, outputPath } = useFFmpeg({
  inputPath,
  outputFolder,
  outputFilename,
  format,
  videoCodec,
  audioCodec,
  parseOutputFolderInputHandler
})

const displayItems = computed(() => computeDisplayItems(metadata.value))
const metadataView = computed({
  get() { return showRaw.value ? 'raw' : 'visual' },
  set(v) { showRaw.value = (v === 'raw') }
})

async function fetchFFmpegVersion() {
  if (!window.electronAPI || !window.electronAPI.getFFmpegVersion) {
    ffmpegVersion.value = '不可用 (preload 未暴露)'
    return
  }
  loadingVersion.value = true
  try {
    const res = await window.electronAPI.getFFmpegVersion()
    if (res && res.success) {
      ffmpegVersion.value = res.version || (res.raw ? res.raw.split(/\r?\n/)[0] : '未知')
    } else {
      ffmpegVersion.value = `获取失败: ${res && res.error ? res.error : 'unknown'}`
    }
  } catch (e) {
    ffmpegVersion.value = `错误: ${e && e.message ? e.message : String(e)}`
  } finally { loadingVersion.value = false }
}

const theme = useTheme()
const isDark = computed(() => theme.global.name.value === 'dark')
function toggleTheme() {
  const name = isDark.value ? 'light' : 'dark'
  theme.global.name.value = name
  try { localStorage.setItem('theme', name) } catch (e) {}
}

function openSettings() {
  showSettings.value = true
  try { fetchFFmpegVersion() } catch (e) { }
}

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
        <ToolbarActions :isDark="isDark" :onToggleTheme="toggleTheme" :onOpenSettings="openSettings" />
      </v-app-bar>

    <v-main>
      <v-container class="pa-4" style="max-width:760px;margin:0 auto">
        <v-tabs v-model="selectedTab" class="mb-4">
          <v-tab>信息</v-tab>
          <v-tab>转换</v-tab>
        </v-tabs>

        
        <div v-if="selectedTab === 0">
          <Suspense>
            <template #default>
                  <InfoTab
                    :infoFile="infoFile"
                    :metadata="metadata"
                    :probing="probing"
                    :showRaw="showRaw"
                    :displayItems="displayItems"
                    :chooseInfoFile="chooseInfoFileHandler"
                    :parseInfoFileInput="parseInfoFileInputHandler"
                    :probeFile="probeFile"
                    :setInfoFile="setInfoFile"
                    :setShowRaw="setShowRaw"
                  />
            </template>
            <template #fallback>
              <v-card class="pa-4 mb-4"><div style="height:120px;display:flex;align-items:center;justify-content:center">加载中...</div></v-card>
            </template>
          </Suspense>
        </div>

        
        <div v-if="selectedTab === 1">
          <Suspense>
            <template #default>
              <ConvertTab
                :inputPath="inputPath"
                :outputPath="outputPath"
                :outputFolder="outputFolder"
                :outputFilename="outputFilename"
                :format="format"
                :running="running"
                :status="status"
                :percent="percent"
                :frame="frame"
                :fps="fps"
                :totalSize="totalSize"
                :estFinalSize="estFinalSize"
                :speed="speed"
                :videoCodec="videoCodec"
                :audioCodec="audioCodec"
                :videoCodecs="videoCodecs"
                :audioCodecs="audioCodecs"
                :chooseFile="chooseFileHandler"
                :chooseOutputFolder="chooseOutputFolderHandler"
                :parseOutputFolderInput="parseOutputFolderInputHandler"
                :parseInputPathInput="parseInputPathInputHandler"
                :run="run"
                :setInputPath="setInputPath"
                :setOutputFolder="setOutputFolder"
                :setOutputFilename="setOutputFilename"
                :setFormat="setFormat"
                :setVideoCodec="setVideoCodec"
                :setAudioCodec="setAudioCodec"
              />
            </template>
            <template #fallback>
              <v-card class="pa-4 mb-4"><div style="height:120px;display:flex;align-items:center;justify-content:center">加载中...</div></v-card>
            </template>
          </Suspense>
        </div>

      </v-container>
    </v-main>
      
      <v-dialog v-model="showSettings" width="420">
        <template #default>
          <SettingsDialogContent
              :ffmpegVersion="ffmpegVersion"
              :loadingVersion="loadingVersion"
              :fetchFFmpegVersion="fetchFFmpegVersion"
              :setShowSettings="(v) => (showSettings.value = v)"
              @close="showSettings = false"
            />
        </template>
      </v-dialog>
  </v-app>
</template>

<style scoped>
  
  .label{color:var(--v-theme-on-surface);opacity:0.8;font-size:14px}
  .status-text{font-weight:500;color:var(--v-theme-on-surface)}
  .meta{color:var(--v-theme-on-surface);opacity:0.85;font-size:13px}
  .waiting{color:var(--v-theme-on-surface);opacity:0.7}

  
</style>