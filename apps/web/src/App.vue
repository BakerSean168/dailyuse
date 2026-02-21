<script setup lang="ts">
/**
 * App.vue - 应用根组件 (精简版)
 *
 * 仅包含路由视图、全局通知（Sonner）和全局确认弹窗。
 */
import { Toaster } from '@dailyuse/ui-vue-shadcn';
import { GlobalConfirmDialog } from '@dailyuse/ui-vue-shadcn';
</script>

<template>
  <router-view />
  <Toaster position="top-right" :duration="3000" rich-colors />
  <GlobalConfirmDialog />
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
