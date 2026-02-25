<script setup lang="ts">
/**
 * Desktop App Root Component
 *
 * Same global overlays as the web app, plus a custom
 * frameless titlebar for the desktop window.
 */
import { watch } from 'vue';
import { Toaster } from '@dailyuse/ui-vue-shadcn';
import {
  GlobalConfirmDialog,
  GlobalErrorBoundary,
  GlobalSheet,
  GlobalCommandPalette,
  GlobalProgressBar,
  useAuthenticationStore,
} from '@dailyuse/app-vue';
import TitleBar from './platform/TitleBar.vue';
import { connectDesktopPowerSync, disconnectDesktopPowerSync } from './platform/powersync';

const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

// ── PowerSync lifecycle: connect/disconnect on auth state changes ──
const authStore = useAuthenticationStore();
watch(
  () => authStore.isAuthenticated,
  async (isAuth) => {
    if (isAuth) {
      await connectDesktopPowerSync();
    } else {
      await disconnectDesktopPowerSync();
    }
  },
  { immediate: true },
);
</script>

<template>
  <!-- Custom frameless titlebar (Desktop only) -->
  <TitleBar v-if="isElectron" />

  <!-- Progress bar -->
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

/* Offset content below the fixed titlebar */
.has-titlebar {
  padding-top: 32px;
}
</style>
