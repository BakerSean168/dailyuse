<script setup lang="ts">
/**
 * Desktop App Root Component
 *
 * Same global overlays as the web app, with Electron using
 * the native window chrome instead of an in-app title bar.
 */
import { Toaster } from '@dailyuse/ui-vue-shadcn';
import {
  AIFloatingBall,
  GlobalConfirmDialog,
  GlobalErrorBoundary,
  GlobalSheet,
  GlobalCommandPalette,
  GlobalProgressBar,
} from '@dailyuse/app-vue';
</script>

<template>
  <!-- Progress bar -->
  <GlobalProgressBar />

  <!-- Error boundary wraps the entire view -->
  <GlobalErrorBoundary>
    <router-view />
  </GlobalErrorBoundary>

  <!-- Global overlays -->
  <Toaster
    class="desktop-toaster"
    position="top-center"
    :duration="3000"
    :offset="{ top: 44, left: 16, right: 16 }"
    :mobile-offset="{ top: 44, left: 16, right: 16 }"
    rich-colors
  />
  <GlobalConfirmDialog />
  <GlobalSheet />
  <GlobalCommandPalette />
  <AIFloatingBall />
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

.desktop-toaster {
  z-index: 12000;
}
</style>
