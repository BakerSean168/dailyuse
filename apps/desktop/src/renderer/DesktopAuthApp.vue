<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue';
import { APP_TITLE_NAME, logo48 } from '@dailyuse/assets';
import { RendererEventChannels, WindowChannels } from '@dailyuse/contracts/electron';
import { Copy, Minus, Sparkles, Square, X } from 'lucide-vue-next';
import { Toaster } from '@dailyuse/ui-vue-shadcn';
import { GlobalErrorBoundary, DesktopAuthView } from '@dailyuse/app-vue';

const isMacPlatform =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const windowControlsState = reactive({
  isMaximized: false,
  isMinimizable: true,
  isMaximizable: true,
  isClosable: true,
});

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

const showCustomWindowControls = computed(() => !isMacPlatform);

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
</script>

<template>
  <div class="desktop-auth-shell" :class="{ 'desktop-auth-shell--mac': isMacPlatform }">
    <header class="desktop-auth-titlebar">
      <div class="desktop-auth-titlebar__content">
        <div class="desktop-auth-titlebar__brand" aria-label="Memoflow">
          <span class="desktop-auth-titlebar__logo-shell">
            <img :src="logo48" alt="" class="desktop-auth-titlebar__logo" />
          </span>
          <span class="desktop-auth-titlebar__brand-copy">
            <span class="desktop-auth-titlebar__brand-name">{{ APP_TITLE_NAME }}</span>
            <span class="desktop-auth-titlebar__brand-tag">
              <Sparkles class="h-3.5 w-3.5" />
              Sign in
            </span>
          </span>
        </div>

        <div
          v-if="showCustomWindowControls"
          class="desktop-auth-titlebar__window-controls"
          role="group"
          aria-label="Window controls"
        >
          <button
            type="button"
            class="desktop-auth-titlebar__window-button"
            :disabled="!windowControlsState.isMinimizable"
            aria-label="Minimize window"
            title="Minimize"
            @click="minimizeWindow"
          >
            <Minus class="desktop-auth-titlebar__window-icon" />
          </button>
          <button
            type="button"
            class="desktop-auth-titlebar__window-button"
            :disabled="!windowControlsState.isMaximizable"
            :aria-label="windowControlsState.isMaximized ? 'Restore window' : 'Maximize window'"
            :title="windowControlsState.isMaximized ? 'Restore' : 'Maximize'"
            @click="toggleWindowMaximize"
          >
            <Copy
              v-if="windowControlsState.isMaximized"
              class="desktop-auth-titlebar__window-icon"
            />
            <Square v-else class="desktop-auth-titlebar__window-icon" />
          </button>
          <button
            type="button"
            class="desktop-auth-titlebar__window-button desktop-auth-titlebar__window-button--close"
            :disabled="!windowControlsState.isClosable"
            aria-label="Close window"
            title="Close"
            @click="closeWindow"
          >
            <X class="desktop-auth-titlebar__window-icon" />
          </button>
        </div>
      </div>
    </header>

    <GlobalErrorBoundary>
      <main class="desktop-auth-content">
        <DesktopAuthView />
      </main>
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
  color-scheme: light dark;
  --desktop-auth-titlebar-height: 44px;
  --desktop-auth-titlebar-surface: hsl(var(--background) / 0.72);
  --desktop-auth-titlebar-border: hsl(var(--border) / 0.42);
  --desktop-auth-titlebar-shadow: hsl(var(--foreground) / 0.08);
  --desktop-auth-titlebar-glow: hsl(var(--foreground) / 0.06);
}

html,
body,
#app {
  height: 100%;
  margin: 0;
}

.desktop-auth-shell {
  display: grid;
  grid-template-rows: var(--desktop-auth-titlebar-height) minmax(0, 1fr);
  height: 100%;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

.desktop-auth-titlebar {
  position: relative;
  overflow: hidden;
  background: var(--desktop-auth-titlebar-surface);
  border-bottom: 1px solid var(--desktop-auth-titlebar-border);
  box-shadow:
    inset 0 1px 0 hsl(var(--foreground) / 0.03),
    inset 0 -1px 0 var(--desktop-auth-titlebar-shadow);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  -webkit-app-region: drag;
  user-select: none;
}

.desktop-auth-titlebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, var(--desktop-auth-titlebar-glow), transparent 60%),
    linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.02), transparent);
  pointer-events: none;
}

.desktop-auth-titlebar__content {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 100%;
  padding: 0 14px 0 10px;
}

.desktop-auth-shell--mac .desktop-auth-titlebar__content {
  padding-left: 84px;
}

.desktop-auth-titlebar__brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  height: 28px;
}

.desktop-auth-titlebar__logo-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid hsl(var(--border) / 0.6);
  background: hsl(var(--card) / 0.8);
}

.desktop-auth-titlebar__logo {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.desktop-auth-titlebar__brand-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.desktop-auth-titlebar__brand-name {
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.005em;
}

.desktop-auth-titlebar__brand-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  line-height: 1;
  color: hsl(var(--muted-foreground));
}

.desktop-auth-titlebar__window-controls {
  display: inline-flex;
  align-items: stretch;
  justify-content: flex-end;
  min-width: 144px;
  height: 100%;
  margin-right: -14px;
  -webkit-app-region: no-drag;
}

.desktop-auth-titlebar__window-button {
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

.desktop-auth-titlebar__window-button:hover {
  background: hsl(var(--foreground) / 0.08);
  color: hsl(var(--foreground));
}

.desktop-auth-titlebar__window-button:active {
  background: hsl(var(--foreground) / 0.14);
}

.desktop-auth-titlebar__window-button:disabled {
  opacity: 0.38;
  cursor: default;
}

.desktop-auth-titlebar__window-button:disabled:hover,
.desktop-auth-titlebar__window-button:disabled:active {
  background: transparent;
}

.desktop-auth-titlebar__window-button--close:hover {
  background: #e11d48;
  color: #ffffff;
}

.desktop-auth-titlebar__window-button--close:active {
  background: #be123c;
}

.desktop-auth-titlebar__window-icon {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

.desktop-auth-content {
  min-height: 0;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

.desktop-auth-toaster {
  z-index: 12000;
}
</style>
