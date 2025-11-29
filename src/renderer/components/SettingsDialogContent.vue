<template>
  <v-card>
    <v-card-title>
      {{ msgs.settings_title }}
      <v-spacer></v-spacer>
    </v-card-title>
    <v-card-text>
      <v-row align="center">
        <v-col cols="4" class="label">{{ msgs.ffmpeg_version_label }}</v-col>
        <v-col cols="8">{{ ffmpegVersion }}</v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click="onRefresh" :loading="loadingVersion">{{ msgs.refresh }}</v-btn>
      <v-btn text @click="onClose">{{ msgs.close }}</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { messages as msgs } from '@/shared/constants/messages'

const props = defineProps({
  ffmpegVersion: { type: String, required: true },
  loadingVersion: { type: Boolean, required: true },
  fetchFFmpegVersion: { type: Function, required: true },
  setShowSettings: { type: Function, required: false }
})
const emit = defineEmits(['close'])

// 设置对话框内容组件：展示 ffmpeg 版本并允许刷新或关闭

/** 触发刷新 ffmpeg 版本的处理器 */
function onRefresh() { props.fetchFFmpegVersion && props.fetchFFmpegVersion() }

/** 关闭设置对话并触发外部回调 */
function onClose() {
  try { if (props.setShowSettings) props.setShowSettings(false) } catch (e) {}
  emit('close')
}
</script>
