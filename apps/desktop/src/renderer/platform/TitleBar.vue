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
  <div class="titlebar">
    <div class="titlebar-title">DailyUse</div>
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
.titlebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  background: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
  -webkit-app-region: drag;
  z-index: 9999;
  user-select: none;
}

.titlebar-title {
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--foreground));
  opacity: 0.8;
}

.titlebar-controls {
  display: flex;
  gap: 2px;
  -webkit-app-region: no-drag;
}

.titlebar-btn {
  width: 32px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: hsl(var(--foreground));
  cursor: pointer;
  border-radius: 4px;
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
