<script setup>
import { computed } from 'vue'
const props = defineProps({
  infoFile: String,
  metadata: Object,
  probing: Boolean,
  showRaw: Boolean,
  displayItems: Array,
  chooseInfoFile: Function,
  parseInfoFileInput: Function,
  probeFile: Function,
  setInfoFile: Function,
  setShowRaw: Function
})

const metadataView = computed({
  get() { return props.showRaw ? 'raw' : 'visual' },
  set(v) { if (props.setShowRaw) props.setShowRaw(v === 'raw') }
})
</script>

<template>
  <v-card class="pa-4 mb-4">
    <v-row align="center">
      <v-col cols="12" md="3"><div class="label">文件：</div></v-col>
            <v-col cols="12" md="9">
              <v-text-field dense :value="infoFile" placeholder="选择要查询的文件..." append-inner-icon="mdi-folder-open" append-outer-icon="mdi-dots-horizontal" @click:append-inner="chooseInfoFile" @click:append-outer="chooseInfoFile" @blur="parseInfoFileInput" @input="e => props.setInfoFile && props.setInfoFile(e)"/>
            </v-col>
    </v-row>

    <v-row class="justify-center">
      <v-col cols="auto">
        <v-btn color="primary" :loading="probing" @click="probeFile" style="min-width:180px;max-width:320px;width:240px">查询元信息</v-btn>
      </v-col>
    </v-row>

    <v-row class="mt-3">
      <v-col cols="12">
        <div v-if="metadata && metadata.success">
          <v-card class="pa-3">
            <v-tabs v-model="metadataView" class="mb-2" background-color="transparent" grow>
              <v-tab value="visual">可视化</v-tab>
              <v-tab value="raw">原始 JSON</v-tab>
            </v-tabs>
            <div style="font-weight:600;margin-bottom:6px">{{ showRaw && showRaw.value ? '原始 JSON 元信息' : '元信息（可视化）' }}</div>
            <template v-if="!(showRaw && showRaw.value)">
              <v-simple-table dense>
                <tbody>
                  <tr v-for="(it, idx) in displayItems" :key="idx">
                    <td style="width:36%;font-weight:600;color:var(--v-theme-on-surface);opacity:0.9">{{ it.k }}</td>
                    <td style="color:var(--v-theme-on-surface);opacity:0.85">{{ it.v }}</td>
                  </tr>
                </tbody>
              </v-simple-table>
            </template>
            <template v-else>
              <pre style="white-space:pre-wrap;word-break:break-word;font-size:12px">{{ JSON.stringify(metadata.data, null, 2) }}</pre>
            </template>
          </v-card>
        </div>
        <div v-else-if="metadata">
          <v-alert type="error">{{ metadata.error || '无法获取元信息' }}</v-alert>
          <pre v-if="metadata.raw">{{ metadata.raw }}</pre>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

 
