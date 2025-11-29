<template>
  <div style="display:flex;align-items:center">
    <v-btn icon :title="msgs.toolbar_version" @click="openSettings">
      <v-icon>mdi-tag</v-icon>
    </v-btn>
    <v-btn icon @click="toggleTheme" :title="msgs.toolbar_toggle_theme">
      <v-icon v-if="isDark">mdi-white-balance-sunny</v-icon>
      <v-icon v-else>mdi-weather-night</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
import { messages as msgs } from '@/shared/constants/messages'

import { useToolbarActions } from '@/shared/composables/useToolbarActions'

const props = defineProps({
  isDark: { type: Boolean, required: true },
  onToggleTheme: { type: Function, required: true },
  onOpenSettings: { type: Function, required: true }
})

const { openSettings, toggleTheme } = useToolbarActions(props)
</script>

<!--
  该组件显示工具栏上的动作按钮（版本/设置与主题切换）。
  逻辑通过 useToolbarActions 提供，UI 仅负责触发。
-->
