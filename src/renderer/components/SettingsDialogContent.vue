<template>
  <v-card>
    <v-card-title>
      设置
      <v-spacer></v-spacer>
    </v-card-title>
    <v-card-text>
      <v-row align="center">
        <v-col cols="4" class="label">FFmpeg 版本</v-col>
        <v-col cols="8">{{ ffmpegVersion }}</v-col>
      </v-row>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn text @click="onRefresh" :loading="loadingVersion">刷新</v-btn>
      <v-btn text @click="onClose">关闭</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
const props = defineProps({
  ffmpegVersion: { type: String, required: true },
  loadingVersion: { type: Boolean, required: true },
  fetchFFmpegVersion: { type: Function, required: true },
  setShowSettings: { type: Function, required: false }
})
const emit = defineEmits(['close'])

function onRefresh() { props.fetchFFmpegVersion && props.fetchFFmpegVersion() }
function onClose() {
  try { if (props.setShowSettings) props.setShowSettings(false) } catch (e) {}
  emit('close')
}
</script>
