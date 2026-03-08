<script setup lang="ts">
/**
 * Custom frameless window titlebar for Desktop.
 *
 * Provides drag region and window control buttons (minimize, maximize, close).
 * Uses IPC channels: window:minimize, window:toggle-maximize, window:close.
 */
const api = window.electronAPI;

function minimize() {
  api?.invoke('window:minimize');
}
function maximize() {
  api?.invoke('window:toggle-maximize');
}
function close() {
  api?.invoke('window:close');
}
</script>

<template>
  <div class="window-drag-area"></div>
  <div class="titlebar-controls-container">
    <div class="titlebar-controls">
      <button class="titlebar-btn" @click="minimize" aria-label="Minimize">
        <svg width="10" height="1" viewBox="0 0 10 1">
          <rect width="10" height="1" fill="currentColor" />
        </svg>
      </button>
      <button class="titlebar-btn" @click="maximize" aria-label="Maximize">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <rect
            x="0.5"
            y="0.5"
            width="9"
            height="9"
            stroke="currentColor"
            fill="none"
            stroke-width="1"
          />
        </svg>
      </button>
      <button class="titlebar-btn titlebar-btn-close" @click="close" aria-label="Close">
        <svg width="10" height="10" viewBox="0 0 10 10">
          <line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" stroke-width="1.2" />
          <line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" stroke-width="1.2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.window-drag-area {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 24px;
  -webkit-app-region: drag;
  z-index: 9998;
}

.titlebar-controls-container {
  position: fixed;
  top: 8px;
  right: 8px;
  z-index: 9999;
  -webkit-app-region: no-drag;
}

.titlebar-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  background: hsla(var(--background), 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid hsla(var(--border), 0.5);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  user-select: none;
}

.titlebar-btn {
  width: 28px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: hsl(var(--foreground));
  cursor: pointer;
  border-radius: 6px;
  opacity: 0.7;
  transition:
    opacity 0.15s,
    background 0.15s;
}

.titlebar-btn:hover {
  opacity: 1;
  background: hsl(var(--muted));
}

.titlebar-btn-close:hover {
  background: hsl(0 70% 50%);
  color: white;
  opacity: 1;
}
</style>
