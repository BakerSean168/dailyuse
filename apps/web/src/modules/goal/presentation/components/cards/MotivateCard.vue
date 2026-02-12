<template>
  <v-card class="motivate-card" elevation="2" @click="refreshContent">
    <!-- 卡片头部 -->
    <v-card-title class="motivate-header pa-4 pb-2">
      <div class="d-flex align-center justify-space-between w-100">
        <div class="d-flex align-center">
          <v-icon
            :color="isShowingMotive ? 'primary' : 'success'"
            size="20"
            class="mr-2 content-icon"
          >
            {{ isShowingMotive ? 'mdi-lighthouse' : 'mdi-lightbulb' }}
          </v-icon>
          <span class="content-type font-weight-medium">
            {{ isShowingMotive ? '目标动机' : '可行性分析' }}
          </span>
        </div>

        <v-btn
          icon="mdi-refresh"
          variant="text"
          size="small"
          color="medium-emphasis"
          class="refresh-btn"
          @click.stop="refreshContent"
        >
          <v-icon size="16">mdi-refresh</v-icon>
          <v-tooltip activator="parent" location="bottom"> 刷新内容 </v-tooltip>
        </v-btn>
      </div>
    </v-card-title>

    <!-- 卡片内容 -->
    <v-card-text class="motivate-content pa-4 pt-2">
      <div class="content-wrapper">
        <div v-if="currentContent" class="content-text">
          {{ currentContent }}
        </div>
        <div v-else class="no-content">
          <v-icon color="medium-emphasis" size="32" class="mb-2">mdi-text-box-outline</v-icon>
          <div class="text-body-2 text-medium-emphasis">暂无内容</div>
        </div>
      </div>

      <!-- 来源信息 -->
      <div v-if="currentGoal" class="source-info mt-3 pt-3">
        <v-divider class="mb-3" />
        <div class="d-flex align-center">
          <v-avatar :color="currentGoal.color || 'primary'" size="20" class="mr-2">
            <v-icon color="white" size="12">mdi-target</v-icon>
          </v-avatar>
          <span class="text-caption text-medium-emphasis"> 来自目标：{{ currentGoal.title }} </span>
        </div>
      </div>
    </v-card-text>

    <!-- 加载状态覆盖层 -->
    <v-overlay v-model="isRefreshing" contained class="align-center justify-center">
      <v-progress-circular color="primary" indeterminate size="32" />
    </v-overlay>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGoalStore } from '@/modules/goal/presentation/stores/goalStore';
import type { Goal } from '@dailyuse/goal/domain-client';

const goalStore = useGoalStore();
const isShowingMotive = ref(true);
const currentContent = ref('');
const currentGoal = ref<Goal | null>(null);
const isRefreshing = ref(false);

const getRandomContent = async () => {
  isRefreshing.value = true;

  const goals = goalStore.getAllGoals;
  if (!goals.length) {
    currentContent.value = '';
    currentGoal.value = null;
    isRefreshing.value = false;
    return;
  }

  // 随机决定显示动机还是可行性
  isShowingMotive.value = Math.random() > 0.5;

  // 过滤有内容的目标
  const validGoals = goals.filter((goal) =>
    isShowingMotive.value ? goal.analysis?.motive?.trim() : goal.analysis?.feasibility?.trim(),
  );

  if (!validGoals.length) {
    currentContent.value = '';
    currentGoal.value = null;
    isRefreshing.value = false;
    return;
  }

  // 选择随机目标
  const randomGoal = validGoals[Math.floor(Math.random() * validGoals.length)];
  currentGoal.value = randomGoal;
  currentContent.value = isShowingMotive.value
    ? randomGoal.analysis?.motive
    : randomGoal.analysis?.feasibility;

  isRefreshing.value = false;
};

const refreshContent = () => {
  getRandomContent();
};

onMounted(() => {
  getRandomContent();
});
</script>

<style scoped>
.motivate-card {
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
  min-height: 160px;
  position: relative;
  overflow: hidden;
}

.motivate-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    rgba(var(--v-theme-primary), 0.6) 0%,
    rgba(var(--v-theme-success), 0.6) 100%
  );
  opacity: 0.8;
}

.motivate-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: rgba(var(--v-theme-primary), 0.3);
}

.motivate-header {
  background: linear-gradient(
    135deg,
    rgba(var(--v-theme-primary), 0.02) 0%,
    rgba(var(--v-theme-success), 0.02) 100%
  );
}

.content-icon {
  transition: all 0.3s ease;
}

.motivate-card:hover .content-icon {
  transform: scale(1.1);
}

.content-type {
  color: rgb(var(--v-theme-on-surface));
  font-size: 0.9rem;
}

.refresh-btn {
  transition: all 0.3s ease;
}

.refresh-btn:hover {
  transform: rotate(180deg);
  background: rgba(var(--v-theme-primary), 0.1);
}

.motivate-content {
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.content-wrapper {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-text {
  color: rgba(var(--v-theme-on-surface), 0.9);
  line-height: 1.6;
  font-size: 1rem;
  font-weight: 400;
  font-style: italic;
  text-align: center;
  padding: 8px 0;
  position: relative;
}

.content-text::before {
  content: '"';
  position: absolute;
  left: -8px;
  top: -4px;
  font-size: 2rem;
  color: rgba(var(--v-theme-primary), 0.3);
  font-family: serif;
}

.content-text::after {
  content: '"';
  position: absolute;
  right: -8px;
  bottom: -4px;
  font-size: 2rem;
  color: rgba(var(--v-theme-primary), 0.3);
  font-family: serif;
}

.no-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  opacity: 0.6;
}

.source-info {
  flex-shrink: 0;
  margin-top: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .motivate-card {
    min-height: 140px;
  }

  .content-text {
    font-size: 0.9rem;
  }

  .motivate-header {
    padding: 12px 16px 8px !important;
  }

  .motivate-content {
    padding: 8px 16px 12px !important;
  }
}
</style>
