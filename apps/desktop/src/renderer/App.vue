<script setup lang="ts">
/**
 * Desktop App Root Component
 *
 * Same global overlays as the web app, with Electron using
 * the native window chrome instead of an in-app title bar.
 */
import { computed } from 'vue';
import { Toaster } from '@dailyuse/ui-vue-shadcn';
import {
  AIFloatingBall,
  GlobalConfirmDialog,
  GlobalErrorBoundary,
  GlobalSheet,
  GlobalCommandPalette,
  GlobalProgressBar,
  useAuthenticationStore,
} from '@dailyuse/app-vue';

const authStore = useAuthenticationStore();
const shouldShowAIFloatingBall = computed(() => authStore.isAuthenticated);
</script>

<template>
  <div class="desktop-shell">
    <div class="desktop-drag-strip" aria-hidden="true" />

    <!-- Progress bar -->
    <GlobalProgressBar />

    <!-- Error boundary wraps the entire view -->
    <GlobalErrorBoundary>
      <main class="desktop-content">
        <router-view />
      </main>
    </GlobalErrorBoundary>
  </div>

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
  <AIFloatingBall v-if="shouldShowAIFloatingBall" />
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

.desktop-shell {
  display: grid;
  grid-template-rows: 36px minmax(0, 1fr);
  height: 100%;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.desktop-drag-strip {
  background: hsl(var(--background));
  app-region: drag;
  -webkit-app-region: drag;
  user-select: none;
}

.desktop-content {
  min-height: 0;
  overflow: hidden;
  app-region: no-drag;
  -webkit-app-region: no-drag;
}

.desktop-toaster {
  z-index: 12000;
}
</style>
