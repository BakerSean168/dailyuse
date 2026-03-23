<script setup lang="ts">
import { computed, inject } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { BOTTOM_NAVIGATION_KEY, MAIN_NAVIGATION_KEY } from '../di/keys';
import { defaultMainNavigation, defaultBottomNavigation } from '../di/navigation';

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

const isActive = (path: string) =>
  path === '/' ? route.path === '/' : route.path.startsWith(path);
const navigateTo = (path: string) => {
  if (route.path !== path) {
    router.push(path);
  }
};
</script>

<template>
  <div class="flex h-full min-h-0 overflow-hidden bg-background">
    <aside class="w-44 flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 p-3 gap-2">
      <button
        v-if="!isDesktopEnvironment"
        class="text-left font-bold px-2 py-2 rounded hover:bg-sidebar-accent"
        @click="navigateTo('/')"
      >
        DailyUse
      </button>

      <nav class="flex-1 space-y-1">
        <button
          v-for="item in mainNavigation"
          :key="item.path"
          class="w-full text-left px-2 py-2 rounded transition-colors"
          :class="
            isActive(item.path)
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'hover:bg-sidebar-accent text-sidebar-foreground'
          "
          @click="navigateTo(item.path)"
        >
          {{ t(item.title) }}
        </button>
      </nav>

      <div class="space-y-1">
        <button
          v-for="item in bottomNavigation"
          :key="item.path"
          class="w-full text-left px-2 py-2 rounded transition-colors"
          :class="
            isActive(item.path)
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'hover:bg-sidebar-accent text-sidebar-foreground'
          "
          @click="navigateTo(item.path)"
        >
          {{ t(item.title) }}
        </button>
      </div>
    </aside>

    <main class="flex-1 min-h-0 overflow-auto">
      <router-view />
    </main>
  </div>
</template>
