<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue';

interface CustomNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  urgency?: 'normal' | 'critical' | 'low';
  data?: Record<string, unknown>;
  timeoutId?: number;
}

const notifications = ref<CustomNotification[]>([]);
const containerRef = ref<HTMLElement | null>(null);

const AUTO_DISMISS_MS = 5000;

function handleReceiveNotification(data: CustomNotification) {
  // If we already have one with this ID, ignore
  if (notifications.value.some((n) => n.id === data.id)) return;

  // Add timeout for auto dismiss
  const timeoutId = window.setTimeout(() => {
    removeNotification(data.id);
  }, AUTO_DISMISS_MS);

  notifications.value.push({ ...data, timeoutId });
}

function removeNotification(id: string) {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index !== -1) {
    const n = notifications.value[index];
    if (n.timeoutId) clearTimeout(n.timeoutId);
    notifications.value.splice(index, 1);
  }
}

function handleClick(notification: CustomNotification) {
  removeNotification(notification.id);
  // Type casting electronAPI because it's injected via contextBridge but not fully typed in this standalone component context
  (window as any).electronAPI.invoke('notification:custom:click', notification.id, notification.data);
}

function handleClose(notification: CustomNotification) {
  removeNotification(notification.id);
  (window as any).electronAPI.invoke('notification:custom:close', notification.id);
}

// Helper to recalculate window bounds after a short delay to account for transitions
async function updateWindowBounds() {
  await nextTick();
  // Slight delay to allow transition classes to apply/finish if needed
  setTimeout(() => {
    if (containerRef.value) {
      const height = notifications.value.length > 0 ? containerRef.value.scrollHeight : 0;
      (window as any).electronAPI.invoke('notification:custom:resize', height);
    }
  }, 50);
}

// Watch for changes in the notification list to trigger window resize
watch(
  () => notifications.value.length,
  async () => {
    updateWindowBounds();
  },
  { immediate: true }
);

function handleMouseEnter() {
  (window as any).electronAPI.invoke('notification:custom:mouse-enter');
}

function handleMouseLeave() {
  (window as any).electronAPI.invoke('notification:custom:mouse-leave');
}

onMounted(() => {
  if ((window as any).electronAPI) {
    (window as any).electronAPI.on('notification:custom:receive', handleReceiveNotification);
  }
});

onUnmounted(() => {
  if ((window as any).electronAPI) {
    (window as any).electronAPI.off('notification:custom:receive', handleReceiveNotification);
  }
  // Clear any remaining timeouts
  notifications.value.forEach((n) => {
    if (n.timeoutId) clearTimeout(n.timeoutId);
  });
});
</script>

<template>
  <div
    ref="containerRef"
    class="flex flex-col gap-2 p-2 pointer-events-none"
    style="width: 100%; min-height: 10px;"
  >
    <TransitionGroup
      name="notification-list"
      @after-leave="updateWindowBounds"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="pointer-events-auto bg-slate-900/90 backdrop-blur-md text-white border border-slate-700 rounded-lg shadow-xl p-4 flex gap-3 relative overflow-hidden group hover:bg-slate-800 transition-colors cursor-pointer"
        @click="handleClick(notification)"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <!-- Urgency indicator strip -->
        <div
          v-if="notification.urgency === 'critical'"
          class="absolute left-0 top-0 bottom-0 w-1 bg-red-500"
        ></div>
        <div
          v-else-if="notification.urgency === 'low'"
          class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
        ></div>

        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm truncate pr-6">{{ notification.title }}</div>
          <div v-if="notification.body" class="text-sm text-slate-300 mt-1 line-clamp-2">
            {{ notification.body }}
          </div>
        </div>

        <button
          @click.stop="handleClose(notification)"
          class="absolute top-3 right-3 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
/* Ensure the body doesn't add its own scrollbars */
:global(body) {
  overflow: hidden !important;
  background-color: transparent !important;
}
:global(#app) {
  background-color: transparent !important;
}

.notification-list-enter-active,
.notification-list-leave-active {
  transition: all 0.3s ease;
}
.notification-list-enter-from {
  opacity: 0;
  transform: translateX(100%);
}
.notification-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>