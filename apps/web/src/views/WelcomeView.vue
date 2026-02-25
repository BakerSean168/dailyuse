<!--
  Welcome Page - 欢迎页
  轻量级首页，无业务模块依赖，用于优化首屏加载速度
-->
<template>
  <div
    class="welcome-page min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4"
  >
    <div class="max-w-4xl w-full">
      <!-- 主要内容卡片 -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
        <!-- 标题区域 -->
        <div class="text-center mb-12">
          <div
            class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 mb-6"
          >
            <div class="i-heroicons-sparkles w-10 h-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            欢迎回来！
          </h1>
          <p class="text-xl text-gray-600 dark:text-gray-300">{{ greeting }}, {{ userName }}</p>
        </div>

        <!-- 快捷入口卡片 -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <!-- Dashboard -->
          <router-link
            to="/dashboard"
            class="group p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div class="flex flex-col items-center text-center">
              <div
                class="w-12 h-12 rounded-full bg-blue-500 dark:bg-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
              >
                <div class="i-heroicons-squares-2x2 w-6 h-6 text-white" />
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">仪表盘</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">统览全局</p>
            </div>
          </router-link>

          <!-- Goals -->
          <router-link
            to="/goals"
            class="group p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div class="flex flex-col items-center text-center">
              <div
                class="w-12 h-12 rounded-full bg-green-500 dark:bg-green-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
              >
                <div class="i-heroicons-flag w-6 h-6 text-white" />
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">目标</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">管理目标</p>
            </div>
          </router-link>

          <!-- Tasks -->
          <router-link
            to="/tasks"
            class="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div class="flex flex-col items-center text-center">
              <div
                class="w-12 h-12 rounded-full bg-purple-500 dark:bg-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
              >
                <div class="i-heroicons-check-circle w-6 h-6 text-white" />
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">任务</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">今日待办</p>
            </div>
          </router-link>

          <!-- Reminders -->
          <router-link
            to="/reminders"
            class="group p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <div class="flex flex-col items-center text-center">
              <div
                class="w-12 h-12 rounded-full bg-orange-500 dark:bg-orange-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
              >
                <div class="i-heroicons-bell w-6 h-6 text-white" />
              </div>
              <h3 class="font-semibold text-gray-900 dark:text-white mb-1">提醒</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">提醒事项</p>
            </div>
          </router-link>
        </div>

        <!-- 快速操作按钮 -->
        <div class="flex flex-wrap gap-4 justify-center">
          <router-link
            to="/dashboard"
            class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <div class="i-heroicons-arrow-right w-5 h-5" />
            进入仪表盘
          </router-link>

          <button
            @click="handleQuickTask"
            class="px-8 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 dark:border-gray-600 flex items-center gap-2"
          >
            <div class="i-heroicons-plus w-5 h-5" />
            快速创建任务
          </button>
        </div>

        <!-- 底部提示 -->
        <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            提示：使用左侧导航栏可以快速访问所有功能
          </p>
        </div>
      </div>

      <!-- 版本信息 -->
      <div class="text-center mt-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">DailyUse v0.1.0 - 让每一天更高效</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthenticationStore } from '@dailyuse/app-vue';

const router = useRouter();
const authStore = useAuthenticationStore();

// 计算时间问候语
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '早上好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});

// 用户名
const userName = computed(() => {
  const identity = authStore.currentIdentity;
  if (!identity) return '用户';
  const email = identity.identifiers?.find((id) => id.type === 'EMAIL');
  return email?.value || '用户';
});

// 快速创建任务
const handleQuickTask = () => {
  router.push('/tasks?action=create');
};
</script>

<style scoped>
/* 渐变动画 */
@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.welcome-page {
  background-size: 200% 200%;
  animation: gradient-shift 15s ease infinite;
}
</style>
