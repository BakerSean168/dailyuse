<script setup lang="ts">
/**
 * GlobalProgressBar.vue
 *
 * 页面顶部极细加载进度条（类似 GitHub / YouTube 的顶部光亮线）。
 * 通过 progressStart() / progressDone() 命令式控制。
 *
 * 无需任何外部依赖，纯 Vue + CSS 实现。
 */
import { _getProgressBarState } from '@dailyuse/ui-vue-shadcn';

const state = _getProgressBarState();
</script>

<template>
  <Transition name="progress">
    <div
      v-if="state.active"
      class="fixed inset-x-0 top-0 z-[9999] h-[2px] pointer-events-none"
    >
      <div
        class="h-full bg-primary transition-all duration-200 ease-out"
        :style="{ width: `${state.progress}%` }"
      >
        <!-- Glow effect at the tip -->
        <div
          class="absolute right-0 top-0 h-full w-24 -translate-y-px"
          style="
            background: linear-gradient(to right, transparent, currentColor);
            opacity: 0.4;
          "
        />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.progress-enter-active {
  transition: opacity 0s;
}
.progress-leave-active {
  transition: opacity 0.4s ease;
}
.progress-enter-from,
.progress-leave-to {
  opacity: 0;
}
</style>
