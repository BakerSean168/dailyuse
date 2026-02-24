<script setup lang="ts">
/**
 * MainLayout - 主布局
 *
 * 包含侧边栏导航 + 主内容区。
 * 侧边栏固定宽度 60px，主内容区充满剩余空间。
 */
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthenticationStore } from '@dailyuse/app-vue';
import {
  LayoutDashboard,
  Shield,
  User,
  LogOut,
  Settings,
  Info,
  MoreHorizontal,
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthenticationStore();

// 导航项目
const navItems = [
  { path: '/', icon: LayoutDashboard, title: '首页', name: 'home' },
  { path: '/governance', icon: Shield, title: '治理规则', name: 'governance' },
];

const bottomItems = [{ path: '/account/center', icon: User, title: '个人中心', name: 'account' }];

const isActive = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

const navigateTo = (path: string) => {
  if (route.path !== path) {
    router.push(path);
  }
};

const handleLogout = () => {
  authStore.reset();
  router.push('/auth');
};
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- 侧边栏 -->
    <aside
      class="w-[60px] flex flex-col items-center bg-sidebar border-r border-sidebar-border shrink-0"
    >
      <!-- Logo -->
      <button
        class="w-11 h-11 my-2 flex items-center justify-center rounded-lg hover:bg-sidebar-accent transition-colors"
        title="DailyUse"
        @click="navigateTo('/')"
      >
        <span class="text-lg font-bold text-sidebar-primary">D</span>
      </button>

      <!-- 主导航区 -->
      <nav class="flex flex-col items-center gap-1 mt-2 flex-1">
        <button
          v-for="item in navItems"
          :key="item.name"
          class="w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
          :class="[
            isActive(item.path)
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent',
          ]"
          :title="item.title"
          @click="navigateTo(item.path)"
        >
          <component :is="item.icon" :size="22" />
        </button>
      </nav>

      <!-- 底部导航区 -->
      <div class="flex flex-col items-center gap-1 mb-2">
        <button
          v-for="item in bottomItems"
          :key="item.name"
          class="w-11 h-11 flex items-center justify-center rounded-lg transition-colors"
          :class="[
            isActive(item.path)
              ? 'bg-sidebar-accent text-sidebar-primary'
              : 'text-sidebar-foreground hover:bg-sidebar-accent',
          ]"
          :title="item.title"
          @click="navigateTo(item.path)"
        >
          <component :is="item.icon" :size="22" />
        </button>

        <!-- 登出 -->
        <button
          class="w-11 h-11 flex items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors"
          title="退出登录"
          @click="handleLogout"
        >
          <LogOut :size="22" />
        </button>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="flex-1 overflow-auto">
      <router-view />
    </main>
  </div>
</template>
