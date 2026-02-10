<template>
  <v-card
    class="goal-info-card"
    :style="{ '--goal-color': goal.color || '#FF5733' }"
    elevation="2"
    @click="navigateToGoalInfo"
  >
    <!-- 卡片头部 -->
    <v-card-title class="goal-card-header pa-4 pb-2">
      <div class="d-flex align-center justify-space-between">
        <div class="goal-title-section">
          <h3 class="goal-title text-h6 font-weight-bold mb-1">{{ goal.title }}</h3>
          <v-chip
            :color="goal.color || 'primary'"
            variant="tonal"
            size="x-small"
            prepend-icon="mdi-target"
            class="goal-status-chip"
          >
            进行中
          </v-chip>
        </div>

        <!-- 今日进度提示 -->
        <div v-if="todayProgress > 0" class="today-progress-badge">
          <v-chip
            color="success"
            variant="elevated"
            size="x-small"
            prepend-icon="mdi-trending-up"
            class="today-progress-chip"
          >
            +{{ Math.round(todayProgress) }}%
          </v-chip>
        </div>
      </div>
    </v-card-title>

    <!-- 进度展示区域 -->
    <v-card-text class="pa-4 pt-1">
      <!-- 主进度条 -->
      <div class="progress-section mb-3">
        <div class="d-flex align-center justify-space-between mb-1">
          <span class="text-caption text-medium-emphasis">完成度</span>
          <span class="text-subtitle-2 font-weight-bold" :style="{ color: goal.color || 'primary' }">
            {{ goal.overallProgress }}%
          </span>
        </div>

        <v-progress-linear
          :model-value="goal.overallProgress"
          :color="goal.color || 'primary'"
          height="8"
          rounded
          class="goal-progress-bar"
        >
          <template v-slot:default="{ value }">
            <div class="progress-glow" :style="{ width: `${value}%` }"></div>
          </template>
        </v-progress-linear>
      </div>

      <!-- 关键结果水平滚动区域 -->
      <div class="key-results-section">
        <div class="d-flex align-center mb-2">
          <v-icon :color="goal.color || 'primary'" size="16" class="mr-1">mdi-target</v-icon>
          <span class="text-subtitle-2 font-weight-medium">关键结果</span>
          <v-spacer />
          <v-chip color="surface-variant" variant="outlined" size="x-small" class="results-count">
            {{ goal.keyResultCount }}
          </v-chip>
        </div>

        <!-- 水平滚动的关键结果容器 -->
        <div class="key-results-scroll-container">
          <div class="key-results-horizontal">
            <KeyResultCard
              v-for="keyResult in goal.keyResults"
              :key="keyResult.uuid"
              :keyResult="keyResult"
              :goal="goal"
              class="key-result-item"
            />
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Goal } from '@dailyuse/goal/domain-client';
import KeyResultCard from './KeyResultCard.vue';

const props = defineProps<{
  goal: Goal;
}>();

const router = useRouter();

// 计算今日进度（暂时返回0，后续可以根据实际需求实现）
const todayProgress = computed(() => {
  // TODO: 实现今日进度计算逻辑
  return 0;
});

const navigateToGoalInfo = () => {
  router.push({ name: 'goal-info', params: { goalUuid: props.goal.uuid } });
};
</script>

<style scoped>
.goal-info-card {
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.goal-info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--goal-color), transparent);
  opacity: 0.8;
}

.goal-info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  border-color: var(--goal-color);
}

.goal-card-header {
  background: linear-gradient(
    135deg,
    rgba(var(--goal-color), 0.04) 0%,
    rgba(var(--goal-color), 0.01) 100%
  );
  flex-shrink: 0;
}

.goal-title {
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
  line-height: 1.2;
  font-size: 1.1rem;
}

.goal-status-chip {
  border-radius: 8px;
}

.today-progress-badge {
  animation: pulse 2s infinite;
}

.today-progress-chip {
  box-shadow: 0 2px 8px rgba(var(--v-theme-success), 0.25);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.8;
  }
}

.progress-section {
  position: relative;
}

.goal-progress-bar {
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  background: rgba(var(--v-theme-surface-variant), 0.3);
}

.progress-glow {
  height: 100%;
  background: linear-gradient(90deg, var(--goal-color), var(--goal-color) 88);
  box-shadow: 0 0 6px rgba(var(--goal-color), 0.4);
  border-radius: inherit;
}

.key-results-section {
  background: rgba(var(--v-theme-surface-variant), 0.15);
  border-radius: 12px;
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 水平滚动容器 */
.key-results-scroll-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.key-results-horizontal {
  display: grid;
  grid-template-columns: repeat(5, minmax(240px, 1fr));
  gap: 12px;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
}

/* 自定义滚动条样式 */
.key-results-horizontal::-webkit-scrollbar {
  height: 4px;
}

.key-results-horizontal::-webkit-scrollbar-track {
  background: rgba(var(--v-theme-surface-variant), 0.3);
  border-radius: 2px;
}

.key-results-horizontal::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-outline), 0.4);
  border-radius: 2px;
  transition: background 0.2s ease;
}

.key-results-horizontal::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--v-theme-outline), 0.6);
}

.key-result-item {
  flex: 0 0 200px;
  /* 固定最小宽度为 200px，不会收缩 */
  transition: all 0.2s ease;
  height: 100%;
}

.key-result-item:hover {
  transform: scale(1.02);
}

.results-count {
  font-size: 0.7rem;
  font-weight: 600;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .goal-info-card {
    height: 180px;
  }

  .goal-card-header {
    padding: 12px !important;
  }

  .goal-info-card .v-card-text {
    padding: 12px !important;
  }

  .key-result-item {
    flex: 0 0 180px;
    /* 移动端稍微减小宽度 */
  }
}

@media (max-width: 600px) {
  .goal-card-header .d-flex {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .today-progress-badge {
    align-self: flex-end;
  }

  .goal-info-card {
    height: 160px;
  }

  .key-result-item {
    flex: 0 0 160px;
    /* 小屏幕进一步减小 */
  }
}
</style>
