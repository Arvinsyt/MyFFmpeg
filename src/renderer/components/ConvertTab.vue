<script setup>
// 转换标签页组件：UI 表单用于配置并触发转换任务，展示进度与状态。
import { humanSize } from '@/shared/utils/format'
import { messages as msgs } from '@/shared/constants/messages'
import { formats } from '@/shared/constants/formats'

const props = defineProps({
  inputControls: Object,
  outputControls: Object,
  outputPath: String,
  format: String,
  running: Boolean,
  status: String,
  percent: Number,
  frame: Number,
  fps: Number,
  totalSize: Number,
  estFinalSize: Number,
  speed: Number,
  videoCodec: String,
  audioCodec: String,
  videoCodecs: Array,
  audioCodecs: Array,
  run: Function,
  setFormat: Function,
  setVideoCodec: Function,
  setAudioCodec: Function
})
</script>

<template>
  <v-card class="pa-4 mb-4">
    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">{{ msgs.label_input }}</div></v-col>
      <v-col cols="12" md="9">
        <v-text-field dense
          :value="props.inputControls.inputPath && props.inputControls.inputPath.value"
          :placeholder="msgs.select_input_placeholder"
          append-inner-icon="mdi-folder-open"
          append-outer-icon="mdi-dots-horizontal"
          @click:append-inner="props.inputControls.chooseFile"
          @click:append-outer="props.inputControls.chooseFile"
          @blur="props.inputControls.parseInputPathInput"
          @input="e => props.inputControls.setInputPath && props.inputControls.setInputPath(e)"
          :title="msgs.choose_file_title"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">{{ msgs.label_format }}</div></v-col>
      <v-col cols="12" md="9">
        <v-select :model-value="props.format" :items="formats" dense @update:model-value="val => props.setFormat && props.setFormat(val)"/>
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">{{ msgs.label_video_codec }}</div></v-col>
      <v-col cols="12" md="9">
        <v-select
          :model-value="props.videoCodec"
          :items="props.videoCodecs"
          item-title="title"
          item-value="value"
          dense
          :disabled="props.format === 'mp3'"
          @update:model-value="val => props.setVideoCodec && props.setVideoCodec(val)"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">{{ msgs.label_audio_codec }}</div></v-col>
      <v-col cols="12" md="9">
        <v-select
          :model-value="props.audioCodec"
          :items="props.audioCodecs"
          item-title="title"
          item-value="value"
          dense
          @update:model-value="val => props.setAudioCodec && props.setAudioCodec(val)"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">{{ msgs.label_output_file }}</div></v-col>
      <v-col cols="12" md="9">
        <v-row>
            <v-col cols="12" md="5">
              <v-text-field dense :value="props.outputControls.outputFolder && props.outputControls.outputFolder.value" :placeholder="msgs.output_folder_placeholder" append-inner-icon="mdi-folder-open" @click:append-inner="props.outputControls.chooseOutputFolder" @blur="props.outputControls.parseOutputFolderInput" @input="e => props.outputControls.setOutputFolder && props.outputControls.setOutputFolder(e)" />
            </v-col>
            <v-col cols="8" md="5">
              <v-text-field dense :value="props.outputControls.outputFilename && props.outputControls.outputFilename.value" :placeholder="msgs.output_filename_placeholder" @input="e => props.outputControls.setOutputFilename && props.outputControls.setOutputFilename(e)" />
          </v-col>
          <v-col cols="4" md="2" class="d-flex align-center">
            <v-text-field dense readonly :value="'.' + props.format" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-row class="justify-center">
        <v-col cols="auto">
        <v-btn color="primary" :disabled="running" @click="run" style="min-width:180px;max-width:320px;width:240px">{{ msgs.btn_start_conversion }}</v-btn>
      </v-col>
    </v-row>

    <v-card v-if="running || percent !== null || frame !== null" class="pa-3">
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center">
            <template v-if="running">
              <v-progress-circular indeterminate color="primary" size="20"></v-progress-circular>
              <div class="status-text ml-3">{{ status || msgs.processing }}</div>
            </template>
            <template v-else-if="percent === 100">
              <v-icon color="success" size="28">mdi-check-circle</v-icon>
              <div class="status-text ml-3">{{ msgs.status_completed }}</div>
            </template>
            <template v-else>
              <div class="waiting">{{ msgs.status_waiting }}</div>
            </template>
          </div>
          <v-progress-linear v-if="percent !== null" :value="percent" class="mt-3"></v-progress-linear>
        </v-col>
      </v-row>
      <v-row class="mt-2">
        <v-col cols="12" class="meta">
          <span v-if="frame">{{ msgs.meta_frame }}: {{ frame }}</span>
          <span v-if="fps"> · {{ msgs.meta_fps }}: {{ fps.toFixed(1) }}</span>
          <span v-if="totalSize"> · {{ msgs.meta_size }}: {{ humanSize(totalSize) }}{{ estFinalSize ? ' / ' + humanSize(estFinalSize) : '' }}</span>
          <span v-if="speed"> · {{ msgs.meta_speed }}: {{ speed.toFixed(2) }}x</span>
        </v-col>
      </v-row>
    </v-card>

  </v-card>
</template>

 
