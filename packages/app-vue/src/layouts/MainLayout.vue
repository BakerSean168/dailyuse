<script setup lang="ts">
import { computed, inject, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { APP_NAME_ZH } from '@dailyuse/assets';
import { BOTTOM_NAVIGATION_KEY, MAIN_NAVIGATION_KEY } from '../di/keys';
import { defaultMainNavigation, defaultBottomNavigation } from '../di/navigation';
import type { NavigationItem } from '../di/types';
import { useNotification } from '../modules/notification/composables/useNotification';
import {
  NotificationBell,
  NotificationDrawer,
  NotificationList,
} from '../modules/notification/components';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const isDesktopEnvironment =
  typeof window !== 'undefined' &&
  !!(window as Window & {
    electronAPI?: { invoke(channel: string, ...args: unknown[]): Promise<unknown> };
  }).electronAPI;

const mainNavigation = computed(() => inject(MAIN_NAVIGATION_KEY) ?? defaultMainNavigation);
const bottomNavigation = computed(() => inject(BOTTOM_NAVIGATION_KEY) ?? defaultBottomNavigation);

/**
 * Group main navigation items by their `group` i18n key, preserving the
 * original array order both within and across groups. Ungrouped items
 * (no `group`) fall into a single leading `null`-keyed group rendered
 * without a header.
 */
const navigationGroups = computed<Array<{ key: string | null; items: NavigationItem[] }>>(() => {
  const groups: Array<{ key: string | null; items: NavigationItem[] }> = [];
  const index = new Map<string | null, { key: string | null; items: NavigationItem[] }>();
  for (const item of mainNavigation.value) {
    const key = item.group ?? null;
    let bucket = index.get(key);
    if (!bucket) {
      bucket = { key, items: [] };
      index.set(key, bucket);
      groups.push(bucket);
    }
    bucket.items.push(item);
  }
  return groups;
});

const isActive = (path: string) =>
  path === '/' ? route.path === '/' : route.path.startsWith(path);
const navigateTo = (path: string) => {
  if (route.path !== path) {
    router.push(path);
  }
};

function navigationTestId(group: 'main' | 'bottom', path: string): string {
  const normalizedPath =
    path === '/' ? 'home' : path.replace(/^\/+|\/+$/g, '').replace(/[^\w]+/g, '-');
  return `${group}-nav-${normalizedPath}`;
}

// ── Notification bell + drawer (sidebar bottom, Plan §0.2 / §11) ──
const notification = useNotification();
const drawerOpen = ref(false);

onMounted(() => {
  void notification.refreshStats();
});

async function openNotificationDrawer() {
  drawerOpen.value = true;
  await notification.fetchNotifications();
}

async function handleMarkAllRead() {
  await notification.markAllAsRead();
}

function handleNotificationClick(item: NotificationClientDTO) {
  void notification.markAsRead(item.id);
  drawerOpen.value = false;
}

function handleViewAllNotifications() {
  drawerOpen.value = false;
  navigateTo('/notifications');
}
</script>

<template>
  <div class="flex h-full min-h-0 overflow-hidden bg-background">
    <aside class="w-44 flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 p-3 gap-2">
      <button
        v-if="!isDesktopEnvironment"
        class="text-left font-bold px-2 py-2 rounded hover:bg-sidebar-accent"
        @click="navigateTo('/')"
      >
        {{ APP_NAME_ZH }}
      </button>

      <nav class="flex-1 space-y-4 overflow-y-auto">
        <div v-for="group in navigationGroups" :key="group.key ?? '_ungrouped'" class="space-y-1">
          <p
            v-if="group.key"
            class="px-2 pt-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70"
          >
            {{ t(group.key) }}
          </p>
          <button
            v-for="item in group.items"
            :key="item.path"
            :data-testid="navigationTestId('main', item.path)"
            class="w-full flex items-center gap-2 text-left px-2 py-2 rounded transition-colors"
            :class="
              isActive(item.path)
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'hover:bg-sidebar-accent text-sidebar-foreground'
            "
            @click="navigateTo(item.path)"
          >
            <component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0" />
            <span class="truncate">{{ t(item.title) }}</span>
          </button>
        </div>
      </nav>

      <div class="space-y-1 border-t border-sidebar-border pt-2">
        <div class="px-2 py-1">
          <NotificationBell
            :unread-count="notification.unreadCount.value"
            :loading="notification.isLoading.value"
            @click="openNotificationDrawer"
          />
        </div>
        <button
          v-for="item in bottomNavigation"
          :key="item.path"
          :data-testid="navigationTestId('bottom', item.path)"
          class="w-full flex items-center gap-2 text-left px-2 py-2 rounded transition-colors"
          :class="
            isActive(item.path)
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'hover:bg-sidebar-accent text-sidebar-foreground'
          "
          @click="navigateTo(item.path)"
        >
          <component :is="item.icon" v-if="item.icon" class="h-4 w-4 shrink-0" />
          <span class="truncate">{{ t(item.title) }}</span>
        </button>
      </div>
    </aside>

    <main class="flex-1 min-h-0 overflow-auto">
      <router-view />
    </main>

    <NotificationDrawer
      v-model="drawerOpen"
      :unread-count="notification.unreadCount.value"
      @mark-all-read="handleMarkAllRead"
      @view-all="handleViewAllNotifications"
    >
      <NotificationList
        :notifications="notification.notifications.value"
        :loading="notification.isLoading.value"
        @notification-click="handleNotificationClick"
        @mark-read="notification.markAsRead"
        @delete="notification.dismiss"
      />
    </NotificationDrawer>
  </div>
</template>
