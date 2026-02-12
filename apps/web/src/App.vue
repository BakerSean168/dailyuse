<script setup lang="ts">
/**
 * App.vue - 应用根组件 (精简版)
 *
 * 仅包含路由视图和全局通知。
 * 移除 Vuetify、AI 组件等未注册模块依赖。
 */
import { Toaster } from '@dailyuse/ui-vue-shadcn';
</script>

<template>
  <router-view />
  <Toaster position="top-right" :duration="3000" rich-colors />
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
