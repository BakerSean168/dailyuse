<script setup lang="ts">
/**
 * App.vue - 应用根组件
 *
 * 全局四大金刚：
 * 1. 视图层 (router-view)
 * 2. 全局通知 / 确认系统 (Toaster, GlobalConfirmDialog)
 * 3. 全局辅助交互 (GlobalCommandPalette, GlobalSheet, GlobalProgressBar)
 * 4. 错误兜底系统 (GlobalErrorBoundary)
 */
import {
  Toaster,
  GlobalConfirmDialog,
  GlobalErrorBoundary,
  GlobalSheet,
  GlobalCommandPalette,
  GlobalProgressBar,
} from '@dailyuse/ui-vue-shadcn';
</script>

<template>
  <!-- Progress bar — always on top -->
  <GlobalProgressBar />

  <!-- Error boundary wraps the entire view -->
  <GlobalErrorBoundary>
    <router-view />
  </GlobalErrorBoundary>

  <!-- Global overlays -->
  <Toaster position="top-right" :duration="3000" rich-colors />
  <GlobalConfirmDialog />
  <GlobalSheet />
  <GlobalCommandPalette />
</template>

<style>
:root {
  color-scheme: light dark;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
}
</style>
