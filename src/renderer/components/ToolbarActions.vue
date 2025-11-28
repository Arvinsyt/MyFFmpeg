<template>
  <div style="display:flex;align-items:center">
    <v-btn icon title="版本" @click="openSettings">
      <v-icon>mdi-tag</v-icon>
    </v-btn>
    <v-btn icon @click="onToggleTheme" title="切换主题">
      <v-icon v-if="isDark">mdi-white-balance-sunny</v-icon>
      <v-icon v-else>mdi-weather-night</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
const props = defineProps({
  isDark: { type: Boolean, required: true },
  onToggleTheme: { type: Function, required: true },
  onOpenSettings: { type: Function, required: true }
})

function openSettings() { props.onOpenSettings && props.onOpenSettings() }
</script>
