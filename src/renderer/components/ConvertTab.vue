<script setup>
import { humanSize } from '@/utils/format'
const props = defineProps({
  inputPath: String,
  outputPath: String,
  outputFolder: String,
  outputFilename: String,
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
  chooseFile: Function,
  chooseOutputFolder: Function,
  parseOutputFolderInput: Function,
  parseInputPathInput: Function,
  normalizeOutputInputs: Function,
  run: Function,
  setInputPath: Function,
  setOutputFolder: Function,
  setOutputFilename: Function,
  setFormat: Function,
  setVideoCodec: Function,
  setAudioCodec: Function
})
</script>

<template>
  <v-card class="pa-4 mb-4">
    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">输入文件：</div></v-col>
      <v-col cols="12" md="9">
        <v-text-field dense
          :value="inputPath"
          placeholder="选择输入文件..."
          append-inner-icon="mdi-folder-open"
          append-outer-icon="mdi-dots-horizontal"
          @click:append-inner="chooseFile"
          @click:append-outer="chooseFile"
          @blur="parseInputPathInput"
          @input="e => props.setInputPath && props.setInputPath(e)"
          title="选择文件"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">输出格式：</div></v-col>
      <v-col cols="12" md="9">
        <v-select :model-value="format" :items="['mp4','mp3','mkv']" dense @update:model-value="val => props.setFormat && props.setFormat(val)"/>
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">视频编码：</div></v-col>
      <v-col cols="12" md="9">
        <v-select
          :model-value="videoCodec"
          :items="videoCodecs"
          item-title="title"
          item-value="value"
          dense
          :disabled="format === 'mp3'"
          @update:model-value="val => props.setVideoCodec && props.setVideoCodec(val)"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">音频编码：</div></v-col>
      <v-col cols="12" md="9">
        <v-select
          :model-value="audioCodec"
          :items="audioCodecs"
          item-title="title"
          item-value="value"
          dense
          @update:model-value="val => props.setAudioCodec && props.setAudioCodec(val)"
        />
      </v-col>
    </v-row>

    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">输出文件：</div></v-col>
      <v-col cols="12" md="9">
        <v-row>
            <v-col cols="12" md="5">
              <v-text-field dense :value="outputFolder" placeholder="选择或输入输出文件夹或完整路径..." append-inner-icon="mdi-folder-open" @click:append-inner="chooseOutputFolder" @blur="parseOutputFolderInput" @input="e => props.setOutputFolder && props.setOutputFolder(e)" />
            </v-col>
            <v-col cols="8" md="5">
              <v-text-field dense :value="outputFilename" placeholder="文件名（不含后缀）" @input="e => props.setOutputFilename && props.setOutputFilename(e)" />
          </v-col>
          <v-col cols="4" md="2" class="d-flex align-center">
            <v-text-field dense readonly :value="'.' + format" />
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <v-row class="justify-center">
      <v-col cols="auto">
        <v-btn color="primary" :disabled="running" @click="run" style="min-width:180px;max-width:320px;width:240px">开始转换</v-btn>
      </v-col>
    </v-row>

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

  </v-card>
</template>

 
