<script setup lang="ts">
import { Toaster } from '@dailyuse/ui-vue-shadcn/components/ui/sonner';
import { GlobalErrorBoundary, DesktopAuthView } from '@dailyuse/app-vue';
</script>

<template>
  <div class="desktop-auth-shell">
    <GlobalErrorBoundary>
      <DesktopAuthView />
    </GlobalErrorBoundary>
  </div>

  <Toaster
    class="desktop-auth-toaster"
    position="top-center"
    :duration="3000"
    :offset="{ top: 60, left: 16, right: 16 }"
    :mobile-offset="{ top: 60, left: 16, right: 16 }"
    rich-colors
  />
</template>

<style>
:root {
  color-scheme: dark;
}

html,
body,
#app {
  height: 100%;
  margin: 0;
  background-color: transparent !important;
}

.desktop-auth-shell {
  height: 100%;
  overflow: hidden;
  background: transparent;
}

.desktop-auth-toaster {
  z-index: 12000;
}
</style>
