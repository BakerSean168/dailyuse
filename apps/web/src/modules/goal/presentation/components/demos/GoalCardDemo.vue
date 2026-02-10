<template>
  <div class="goal-card-demo">
    <h2>GoalCard 组件使用示例</h2>
    <p>此组件已重构为使用内部业务逻辑，暴露 openCard 方法</p>

    <div class="demo-controls mb-4">
      <v-btn color="primary" @click="openSelectedGoalCard" :disabled="!selectedGoalRef">
        打开选中的目标卡片
      </v-btn>
      <v-btn color="secondary" @click="refreshGoals" class="ml-2"> 刷新目标列表 </v-btn>
    </div>

    <div class="goals-grid">
      <GoalCard
        v-for="goal in goals"
        :key="goal.uuid"
        :goal="goal"
        ref="goalCardRefs"
        @click="selectGoal(goal)"
        :class="{ selected: selectedGoal?.uuid === goal.uuid }"
      />
    </div>

    <div v-if="goals.length === 0" class="text-center pa-8">
      <v-icon size="64" color="medium-emphasis">mdi-target-variant</v-icon>
      <p class="text-h6 mt-4 text-medium-emphasis">暂无目标数据</p>
      <p class="text-body-2 text-medium-emphasis">请先创建一些目标</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Goal } from '@dailyuse/goal/domain-client';
import { useGoal } from '../../composables/useGoal';
import GoalCard from '../cards/GoalCard.vue';

const goalComposable = useGoal();

// 响应式状态
const goalCardRefs = ref<InstanceType<typeof GoalCard>[]>([]);
const selectedGoal = ref<Goal | null>(null);

// 计算属性
const goals = computed(() => goalComposable.goals.value);
const selectedGoalRef = computed(() => {
  if (!selectedGoal.value) return null;
  return goalCardRefs.value.find(
    (cardRef, index) => goals.value[index]?.uuid === selectedGoal.value?.uuid,
  );
});

// 业务方法
const selectGoal = (goal: Goal) => {
  selectedGoal.value = goal;
};

const openSelectedGoalCard = () => {
  if (selectedGoalRef.value) {
    // 调用暴露的 openCard 方法
    selectedGoalRef.value.openCard();
  }
};

const refreshGoals = async () => {
  try {
    await goalComposable.fetchGoals(true); // 强制刷新
  } catch (error) {
    console.error('Failed to refresh goals:', error);
  }
};

// 生命周期
onMounted(async () => {
  try {
    // 初始化加载目标数据
    await goalComposable.fetchGoals();
  } catch (error) {
    console.error('Failed to load goals:', error);
  }
});
</script>

<style scoped>
.goal-card-demo {
  padding: 24px;
}

.demo-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.goal-card:hover {
  cursor: pointer;
}

.goal-card.selected {
  box-shadow: 0 0 0 2px rgb(var(--v-theme-primary));
  border: 2px solid rgb(var(--v-theme-primary));
}

.goal-card.selected:hover {
  box-shadow:
    0 0 0 2px rgb(var(--v-theme-primary)),
    0 12px 40px rgba(0, 0, 0, 0.15);
}
</style>
