<template>
  <div class="goal-review-card-demo">
    <h2>GoalReviewCard 组件使用示例</h2>
    <p>此组件已重构为使用内部业务逻辑，暴露 openDialog 方法</p>

    <div class="demo-controls mb-4">
      <v-btn color="primary" @click="openReviewDialog" :disabled="!selectedGoal">
        打开复盘对话框
      </v-btn>
      <v-btn
        color="secondary"
        @click="selectRandomGoal"
        class="ml-2"
        :disabled="goals.length === 0"
      >
        随机选择目标
      </v-btn>
      <v-btn color="info" @click="refreshGoals" class="ml-2"> 刷新目标列表 </v-btn>
    </div>

    <!-- 目标选择 -->
    <v-card class="mb-4" variant="outlined">
      <v-card-title>选择目标</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedGoal"
          :items="goals"
          item-title="title"
          item-value="uuid"
          return-object
          label="选择一个目标查看复盘"
          variant="outlined"
          density="comfortable"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-avatar :color="item.raw.color" size="32" class="mr-3">
                  <v-icon color="white" size="16">mdi-target</v-icon>
                </v-avatar>
              </template>
              <template #title>
                <span class="font-weight-medium">{{ item.raw.title }}</span>
              </template>
              <template #subtitle>
                <span class="text-caption text-medium-emphasis">
                  {{ item.raw.description?.substring(0, 50) }}...
                </span>
              </template>
            </v-list-item>
          </template>
        </v-select>
      </v-card-text>
    </v-card>

    <!-- 选中目标信息 -->
    <v-card v-if="selectedGoal" class="mb-4" variant="outlined">
      <v-card-title class="d-flex align-center">
        <v-avatar :color="selectedGoal.color || 'primary'" size="40" class="mr-3">
          <v-icon color="white">mdi-target</v-icon>
        </v-avatar>
        <div>
          <div class="text-h6 font-weight-bold">{{ selectedGoal.title }}</div>
          <div class="text-caption text-medium-emphasis">{{ selectedGoal.uuid }}</div>
        </div>
      </v-card-title>
      <v-card-text>
        <p v-if="selectedGoal.description" class="text-body-2 mb-3">
          {{ selectedGoal.description }}
        </p>
        <div class="d-flex gap-4">
          <v-chip color="primary" size="small" variant="tonal">
            <v-icon start size="12">mdi-calendar-range</v-icon>
            {{ selectedGoal.startDate ? format(selectedGoal.startDate, 'yyyy-MM-dd') : 'N/A' }} -
            {{ selectedGoal.targetDate ? format(selectedGoal.targetDate, 'yyyy-MM-dd') : 'N/A' }}
          </v-chip>
          <v-chip color="success" size="small" variant="tonal">
            <v-icon start size="12">mdi-chart-line</v-icon>
            进度: {{ Math.round((selectedGoal.weightedProgress ?? selectedGoal.overallProgress ?? 0)) }}%
          </v-chip>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-btn
          color="primary"
          variant="elevated"
          prepend-icon="mdi-book-edit"
          @click="openReviewDialog"
        >
          查看复盘记录
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- 空状态 -->
    <div v-if="goals.length === 0" class="text-center pa-8">
      <v-icon size="64" color="medium-emphasis">mdi-target-variant</v-icon>
      <p class="text-h6 mt-4 text-medium-emphasis">暂无目标数据</p>
      <p class="text-body-2 text-medium-emphasis">请先创建一些目标以查看复盘功能</p>
    </div>

    <!-- GoalReviewCard 组件 -->
    <GoalReviewCard v-if="selectedGoal" :goal="selectedGoal" ref="reviewCardRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { GoalClient } from '@dailyuse/contracts/goal';
import { Goal } from '@dailyuse/goal/domain-client';
import { format } from 'date-fns';
import { useGoal } from '../../composables/useGoal';
import GoalReviewCard from '../cards/GoalReviewListCard.vue';

const goalComposable = useGoal();

// 响应式状态
const reviewCardRef = ref<InstanceType<typeof GoalReviewCard> | null>(null);
const selectedGoal = ref<GoalClient | null>(null);

// 计算属性
const goals = computed(() => goalComposable.goals.value);

// 业务方法
const openReviewDialog = () => {
  if (reviewCardRef.value && selectedGoal.value) {
    // 调用暴露的 openDialog 方法
    reviewCardRef.value.openDialog();
  }
};

const selectRandomGoal = () => {
  if (goals.value.length > 0) {
    const randomIndex = Math.floor(Math.random() * goals.value.length);
    selectedGoal.value = goals.value[randomIndex];
  }
};

const refreshGoals = async () => {
  try {
    await goalComposable.fetchGoals(true); // 强制刷新
    // 如果当前选中的目标不存在了，清除选择
    if (selectedGoal.value && !goals.value.find((g: Goal) => g.uuid === selectedGoal.value?.uuid)) {
      selectedGoal.value = null;
    }
  } catch (error) {
    console.error('Failed to refresh goals:', error);
  }
};

// 生命周期
onMounted(async () => {
  try {
    // 初始化加载目标数据
    await goalComposable.fetchGoals();
    // 如果有目标，自动选择第一个
    if (goals.value.length > 0) {
      selectedGoal.value = goals.value[0];
    }
  } catch (error) {
    console.error('Failed to load goals:', error);
  }
});
</script>

<style scoped>
.goal-review-card-demo {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.demo-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.demo-controls .v-btn {
  min-width: 120px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .goal-review-card-demo {
    padding: 16px;
  }

  .demo-controls {
    flex-direction: column;
  }

  .demo-controls .v-btn {
    width: 100%;
  }
}
</style>
