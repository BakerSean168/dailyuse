<script setup lang="ts">
/**
 * Desktop App Root Component
 *
 * Same global overlays as the web app, with a custom desktop title bar
 * on Windows/Linux and native traffic lights preserved on macOS.
 */
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';
import { APP_TITLE_NAME, logo48 } from '@dailyuse/assets';
import { RendererEventChannels, WindowChannels } from '@dailyuse/contracts/electron';
import { useRoute, useRouter } from 'vue-router';
import { Copy, Minus, Square, X } from 'lucide-vue-next';
import { Toaster } from '@dailyuse/ui-vue-shadcn';
import { GlobalErrorBoundary, GlobalProgressBar, useThemeSync } from '@dailyuse/app-vue';
import { GlobalOverlays } from '@dailyuse/app-vue/web-overlays';

const route = useRoute();
const router = useRouter();
const isCustomNotificationRoute = computed(() => route.name === 'custom-notification');
const showDesktopTitlebar = computed(() => route.name !== 'custom-notification');
const isMacPlatform =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const showCustomWindowControls = computed(() => !isMacPlatform && showDesktopTitlebar.value);
const windowControlsState = reactive({
  isMaximized: false,
  isMinimizable: true,
  isMaximizable: true,
  isClosable: true,
});

function navigateHome() {
  if (route.path !== '/') {
    void router.push('/');
  }
}

function applyWindowControlsState(state: Partial<typeof windowControlsState> | null | undefined) {
  if (!state) {
    return;
  }

  windowControlsState.isMaximized = state.isMaximized ?? windowControlsState.isMaximized;
  windowControlsState.isMinimizable = state.isMinimizable ?? windowControlsState.isMinimizable;
  windowControlsState.isMaximizable = state.isMaximizable ?? windowControlsState.isMaximizable;
  windowControlsState.isClosable = state.isClosable ?? windowControlsState.isClosable;
}

async function syncWindowControlsState() {
  const state = (await window.electronAPI?.invoke(WindowChannels.GET_CONTROLS_STATE)) as
    | Partial<typeof windowControlsState>
    | null
    | undefined;
  applyWindowControlsState(state);
}

async function minimizeWindow() {
  await window.electronAPI?.invoke(WindowChannels.MINIMIZE);
}

async function toggleWindowMaximize() {
  const state = (await window.electronAPI?.invoke(WindowChannels.TOGGLE_MAXIMIZE)) as
    | Partial<typeof windowControlsState>
    | null
    | undefined;
  applyWindowControlsState(state);
}

async function closeWindow() {
  await window.electronAPI?.invoke(WindowChannels.CLOSE);
}

const handleWindowStateChanged = (...args: unknown[]) => {
  applyWindowControlsState(args[0] as Partial<typeof windowControlsState> | null | undefined);
};

onMounted(() => {
  if (!showCustomWindowControls.value) {
    return;
  }

  void syncWindowControlsState();
  window.electronAPI?.on(RendererEventChannels.WINDOW_STATE_CHANGED, handleWindowStateChanged);
});

onBeforeUnmount(() => {
  window.electronAPI?.off(RendererEventChannels.WINDOW_STATE_CHANGED, handleWindowStateChanged);
});

useThemeSync();
</script>

<template>
  <GlobalErrorBoundary v-if="isCustomNotificationRoute">
    <router-view />
  </GlobalErrorBoundary>

  <div
    v-else
    class="desktop-shell"
    :class="{
      'desktop-shell--mac': isMacPlatform,
      'desktop-shell--no-titlebar': !showDesktopTitlebar,
    }"
  >
    <header v-if="showDesktopTitlebar" class="desktop-titlebar">
      <div class="desktop-titlebar__content">
        <button type="button" class="desktop-titlebar__brand" @click="navigateHome">
          <span class="desktop-titlebar__logo-shell">
            <img :src="logo48" alt="" class="desktop-titlebar__logo" />
          </span>
          <span class="desktop-titlebar__brand-copy">
            <span class="desktop-titlebar__brand-name">{{ APP_TITLE_NAME }}</span>
          </span>
        </button>

        <div
          v-if="showCustomWindowControls"
          class="desktop-titlebar__window-controls"
          role="group"
          aria-label="Window controls"
        >
          <button
            type="button"
            class="desktop-titlebar__window-button"
            :disabled="!windowControlsState.isMinimizable"
            aria-label="Minimize window"
            title="Minimize"
            @click="minimizeWindow"
          >
            <Minus class="desktop-titlebar__window-icon" />
          </button>
          <button
            type="button"
            class="desktop-titlebar__window-button"
            :disabled="!windowControlsState.isMaximizable"
            :aria-label="windowControlsState.isMaximized ? 'Restore window' : 'Maximize window'"
            :title="windowControlsState.isMaximized ? 'Restore' : 'Maximize'"
            @click="toggleWindowMaximize"
          >
            <Copy v-if="windowControlsState.isMaximized" class="desktop-titlebar__window-icon" />
            <Square v-else class="desktop-titlebar__window-icon" />
          </button>
          <button
            type="button"
            class="desktop-titlebar__window-button desktop-titlebar__window-button--close"
            :disabled="!windowControlsState.isClosable"
            aria-label="Close window"
            title="Close"
            @click="closeWindow"
          >
            <X class="desktop-titlebar__window-icon" />
          </button>
        </div>
        <div v-else class="desktop-titlebar__window-gap" aria-hidden="true" />
      </div>
    </header>

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
  --desktop-titlebar-height: 44px;
  --desktop-window-controls-width: 144px;
  --desktop-titlebar-surface: hsl(var(--background) / 0.72);
  --desktop-titlebar-border: hsl(var(--border) / 0.42);
  --desktop-titlebar-shadow: hsl(var(--foreground) / 0.08);
  --desktop-titlebar-glow: hsl(var(--foreground) / 0.06);
}

@media (prefers-color-scheme: dark) {
  :root {
    --desktop-titlebar-surface: hsl(var(--background) / 0.72);
    --desktop-titlebar-border: hsl(var(--border) / 0.42);
    --desktop-titlebar-shadow: hsl(var(--foreground) / 0.08);
    --desktop-titlebar-glow: hsl(var(--foreground) / 0.04);
  }
}

html,
body,
#app {
  height: 100%;
  margin: 0;
}

.desktop-shell {
  display: grid;
  grid-template-rows: var(--desktop-titlebar-height) minmax(0, 1fr);
  height: 100%;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.desktop-shell--no-titlebar {
  grid-template-rows: minmax(0, 1fr);
}

.desktop-titlebar {
  position: relative;
  overflow: hidden;
  background: var(--desktop-titlebar-surface);
  border-bottom: 1px solid var(--desktop-titlebar-border);
  box-shadow:
    inset 0 1px 0 hsl(var(--foreground) / 0.03),
    inset 0 -1px 0 var(--desktop-titlebar-shadow);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  -webkit-app-region: drag;
  user-select: none;
}

.desktop-titlebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, var(--desktop-titlebar-glow), transparent 60%),
    linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.02), transparent);
  pointer-events: none;
}

.desktop-titlebar__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 100%;
  padding: 0 14px 0 10px;
}

.desktop-shell--mac .desktop-titlebar__content {
  padding-left: 84px;
  padding-right: 14px;
}

.desktop-titlebar__brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 28px;
  padding: 0 6px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  transition:
    opacity 160ms ease,
    transform 160ms ease;
  -webkit-app-region: no-drag;
}

.desktop-titlebar__brand:hover {
  opacity: 0.82;
}

.desktop-titlebar__brand:active {
  opacity: 0.72;
  transform: translateY(1px);
}

.desktop-titlebar__logo-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  background: transparent;
  border: 1px solid transparent;
}

.desktop-titlebar__logo {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.desktop-titlebar__brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  align-items: flex-start;
}

.desktop-titlebar__brand-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.005em;
}

.desktop-titlebar__window-gap {
  flex: 0 0 var(--desktop-window-controls-width);
}

.desktop-shell--mac .desktop-titlebar__window-gap {
  flex-basis: 0;
}

.desktop-titlebar__window-controls {
  display: inline-flex;
  align-items: stretch;
  justify-content: flex-end;
  min-width: var(--desktop-window-controls-width);
  height: 100%;
  margin-right: -14px;
  -webkit-app-region: no-drag;
}

.desktop-titlebar__window-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 100%;
  border: 0;
  background: transparent;
  color: hsl(var(--foreground) / 0.88);
  cursor: pointer;
  transition:
    background-color 140ms ease,
    color 140ms ease;
}

.desktop-titlebar__window-button:hover {
  background: hsl(var(--foreground) / 0.08);
  color: hsl(var(--foreground));
}

.desktop-titlebar__window-button:active {
  background: hsl(var(--foreground) / 0.14);
}

.desktop-titlebar__window-button:disabled {
  opacity: 0.38;
  cursor: default;
}

.desktop-titlebar__window-button:disabled:hover,
.desktop-titlebar__window-button:disabled:active {
  background: transparent;
}

.desktop-titlebar__window-button--close:hover {
  background: #e11d48;
  color: #ffffff;
}

.desktop-titlebar__window-button--close:active {
  background: #be123c;
}

.desktop-titlebar__window-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

.desktop-content {
  min-height: 0;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

.desktop-toaster {
  z-index: 12000;
}
</style>
