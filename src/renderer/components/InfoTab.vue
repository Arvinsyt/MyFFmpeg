<script setup>
// 信息查询页面组件：显示媒体文件的元信息（可视化或原始 JSON）。
import { computed } from 'vue'
import { messages as msgs } from '@/shared/constants/messages'
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

/**
 * metadataView 计算属性：在可视化与原始 JSON 视图间切换，并通知父组件。
 */
const metadataView = computed({
  get() { return props.showRaw ? 'raw' : 'visual' },
  set(v) { if (props.setShowRaw) props.setShowRaw(v === 'raw') }
})
</script>

<template>
  <v-card class="pa-4 mb-4">
    <v-row align="center">
        <v-col cols="12" md="3"><div class="label">{{ msgs.label_file }}</div></v-col>
              <v-col cols="12" md="9">
                <v-text-field dense :value="infoFile" :placeholder="msgs.selectInfoFile" append-inner-icon="mdi-folder-open" append-outer-icon="mdi-dots-horizontal" @click:append-inner="chooseInfoFile" @click:append-outer="chooseInfoFile" @blur="parseInfoFileInput" @input="e => props.setInfoFile && props.setInfoFile(e)"/>
              </v-col>
      </v-row>

      <v-row class="justify-center">
        <v-col cols="auto">
          <v-btn color="primary" :loading="probing" @click="probeFile" style="min-width:180px;max-width:320px;width:240px">{{ msgs.btn_query_metadata }}</v-btn>
        </v-col>
      </v-row>

    <v-row class="mt-3">
      <v-col cols="12">
        <div v-if="metadata && metadata.success">
          <v-card class="pa-3">
            <v-tabs v-model="metadataView" class="mb-2" background-color="transparent" grow>
              <v-tab value="visual">{{ msgs.metadata_tab_visual }}</v-tab>
              <v-tab value="raw">{{ msgs.metadata_tab_raw }}</v-tab>
            </v-tabs>
                <div style="font-weight:600;margin-bottom:6px">{{ metadataView === 'raw' ? msgs.metadata_tab_raw : msgs.metadata_tab_visual }}</div>
              <template v-if="metadataView !== 'raw'">
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
          <v-alert type="error">{{ metadata.error || msgs.unable_get_metadata }}</v-alert>
          <pre v-if="metadata.raw">{{ metadata.raw }}</pre>
        </div>
      </v-col>
    </v-row>
  </v-card>
</template>

 
