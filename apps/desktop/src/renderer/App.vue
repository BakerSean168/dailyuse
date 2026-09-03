<script setup lang="ts">
/**
 * Desktop App Root Component
 *
 * Same global overlays as the web app. Since the V2 shell switch
 * (UI_REDESIGN_V2_PLAN §2), the authenticated route tree renders AppShell,
 * whose WindowHeader owns the drag region and window controls. Authentication
 * uses its own renderer bootstrap, and the custom notification window stays
 * chrome-less.
 */
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { Toaster } from '@memoflow/ui-vue-shadcn/components/ui/sonner';
import {
  GlobalErrorBoundary,
  GlobalProgressBar,
  useLocaleSync,
  usePresentationBootstrap,
  useThemeSync,
} from '@memoflow/app-vue';
import { GlobalOverlays } from '@memoflow/app-vue/web-overlays';

const route = useRoute();
const isCustomNotificationRoute = computed(() => route.name === 'custom-notification');

useThemeSync();
useLocaleSync();
usePresentationBootstrap();
</script>

<template>
  <GlobalErrorBoundary v-if="isCustomNotificationRoute">
    <router-view />
  </GlobalErrorBoundary>

  <div v-else class="desktop-shell">
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
    :offset="{ top: 60, left: 16, right: 16 }"
    :mobile-offset="{ top: 60, left: 16, right: 16 }"
    rich-colors
  />
  <GlobalOverlays />
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
  grid-template-rows: minmax(0, 1fr);
  height: 100%;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.desktop-content {
  min-height: 0;
  overflow: hidden;
}

.desktop-toaster {
  z-index: 12000;
}
</style>
