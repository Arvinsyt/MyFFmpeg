<script setup>
// 该文件为主视图组件，负责切换信息与转换标签页，并协调各个子组件和 composables。
import { ref, computed, defineAsyncComponent } from 'vue'
import { messages as msgs } from '@/shared/constants/messages'
import { chooseInfoFile, parseInfoFileInput } from '@/shared/utils/app-helpers'
import { useInputControls } from '@/shared/composables/useInputControls'
import { useOutputControls } from '@/shared/composables/useOutputControls'
import { videoCodecs as defaultVideoCodecs, audioCodecs as defaultAudioCodecs } from '@/shared/constants/codecs'
import { useFFmpeg } from '@/shared/composables/useFFmpeg'
import { useProbe } from '@/shared/composables/useProbe'
import { useFFmpegSettings } from '@/shared/composables/useFFmpegSettings'

const InfoTab = defineAsyncComponent(() => import('./components/InfoTab.vue'))
const ConvertTab = defineAsyncComponent(() => import('./components/ConvertTab.vue'))
const ToolbarActions = defineAsyncComponent(() => import('./components/ToolbarActions.vue'))
const SettingsDialogContent = defineAsyncComponent(() => import('./components/SettingsDialogContent.vue'))

const { infoFile, metadata, probing, showRaw, displayItems, metadataView, probeFile, setInfoFile, setShowRaw } = useProbe()

const { isDark, toggleTheme, showSettings, ffmpegVersion, loadingVersion, fetchFFmpegVersion, openSettings } = useFFmpegSettings()

/**
 * 触发选择信息文件的处理器（包装 util 函数）。
 */
const chooseInfoFileHandler = () => chooseInfoFile(infoFile)

/**
 * 解析信息文件输入的处理器（包装 util 函数）。
 */
const parseInfoFileInputHandler = () => parseInfoFileInput(infoFile)

const selectedTab = ref(0)

const { outputFolder, outputFilename, setOutputFolder, setOutputFilename, chooseOutputFolderHandler, parseOutputFolderInputHandler } = useOutputControls('', 'output')
const { inputPath, setInputPath, chooseFileHandler, parseInputPathInputHandler } = useInputControls(outputFolder, outputFilename, '')
const format = ref('mp4')

const inputControls = {
  inputPath,
  setInputPath,
  chooseFile: chooseFileHandler,
  parseInputPathInput: parseInputPathInputHandler
}

const outputControls = {
  outputFolder,
  outputFilename,
  setOutputFolder,
  setOutputFilename,
  chooseOutputFolder: chooseOutputFolderHandler,
  parseOutputFolderInput: parseOutputFolderInputHandler
}

const videoCodec = ref('copy')
const audioCodec = ref('copy')
const videoCodecs = ref(defaultVideoCodecs)
const audioCodecs = ref(defaultAudioCodecs)


/**
 * 设置输出格式。
 */
function setFormat(v) { format.value = v }

/**
 * 设置视频编码器值（响应式）。
 */
function setVideoCodec(v) { videoCodec.value = v }

/**
 * 设置音频编码器值（响应式）。
 */
function setAudioCodec(v) { audioCodec.value = v }

const { running, status, percent, frame, fps, totalSize, estFinalSize, speed, run, outputPath } = useFFmpeg({
  inputPath,
  outputFolder,
  outputFilename,
  format,
  videoCodec,
  audioCodec,
  parseOutputFolderInputHandler
})
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
          <v-tab>{{ msgs.tab_info }}</v-tab>
          <v-tab>{{ msgs.tab_convert }}</v-tab>
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
              <v-card class="pa-4 mb-4"><div style="height:120px;display:flex;align-items:center;justify-content:center">{{ msgs.loading }}</div></v-card>
            </template>
          </Suspense>
        </div>

        
        <div v-if="selectedTab === 1">
          <Suspense>
            <template #default>
              <ConvertTab
                :inputControls="inputControls"
                :outputControls="outputControls"
                :outputPath="outputPath"
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
                :run="run"
                :setFormat="setFormat"
                :setVideoCodec="setVideoCodec"
                :setAudioCodec="setAudioCodec"
              />
            </template>
            <template #fallback>
              <v-card class="pa-4 mb-4"><div style="height:120px;display:flex;align-items:center;justify-content:center">{{ msgs.loading }}</div></v-card>
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