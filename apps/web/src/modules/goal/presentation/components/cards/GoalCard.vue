<template>
  <v-card class="goal-card mb-4" elevation="2" :style="{ borderLeft: `4px solid ${goal.color}` }">
    <v-card-text class="pa-6">
      <!-- 目标标题和状态 -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-avatar :color="goal.color || 'primary'" size="40" class="mr-3" variant="tonal">
            <v-icon color="white">mdi-target</v-icon>
          </v-avatar>
          <div>
            <h3 class="text-h6 font-weight-bold mb-1">{{ goal.title }}</h3>
            <v-chip
              :color="getStatusColor()"
              size="small"
              variant="tonal"
              class="font-weight-medium"
            >
              <v-icon start size="12">{{ getStatusIcon() }}</v-icon>
              {{ getStatusText() }}
            </v-chip>
          </div>
        </div>

        <!-- 进度圆环 -->
        <v-progress-circular
          :model-value="goalProgress"
          :color="goal.color || 'primary'"
          size="48"
          width="6"
          class="progress-ring"
        >
          <span class="text-caption font-weight-bold">{{ Math.round(goalProgress) }}%</span>
        </v-progress-circular>
      </div>

      <!-- 目标描述 -->
      <p v-if="goal.description" class="text-body-2 text-medium-emphasis mb-4">
        {{ goal.description }}
      </p>

      <!-- 时间信息 -->
      <div class="d-flex align-center mb-4">
        <v-icon :color="goal.color || 'primary'" size="20" class="mr-2">mdi-calendar-range</v-icon>
        <span class="text-body-2 text-medium-emphasis">
          <template v-if="goal.startDate && goal.targetDate">
            {{ format(new Date(goal.startDate), 'yyyy-MM-dd') }} -
            {{ format(new Date(goal.targetDate), 'yyyy-MM-dd') }}
          </template>
          <template v-else-if="goal.targetDate">
            截止: {{ format(new Date(goal.targetDate), 'yyyy-MM-dd') }}
          </template>
          <template v-else> 未设置时间 </template>
        </span>
        <v-spacer />
        <v-chip
          :color="getRemainingDaysColor()"
          size="small"
          variant="outlined"
          class="font-weight-medium"
        >
          <v-icon start size="12">mdi-clock-outline</v-icon>
          {{ getRemainingDaysText() }}
        </v-chip>
      </div>

      <!-- 进度条 -->
      <div class="mb-2">
        <div class="d-flex justify-space-between align-center mb-1">
          <span class="text-caption text-medium-emphasis">目标进度</span>
          <span class="text-caption font-weight-bold">{{ Math.round(goalProgress) }}%</span>
        </div>
        <v-progress-linear
          :model-value="goalProgress"
          :color="goal.color || 'primary'"
          height="8"
          rounded
          class="progress-bar"
        />
      </div>

      <!-- 关键结果数量 -->
      <div class="d-flex align-center justify-space-between mb-4">
        <div class="d-flex align-center">
          <v-icon color="medium-emphasis" size="16" class="mr-1">mdi-target</v-icon>
          <span class="text-caption text-medium-emphasis">
            {{ completedKeyResultsCount }}/{{ getKeyResultsCount() }} 关键结果完成
          </span>
        </div>
      </div>
    </v-card-text>

    <!-- 卡片操作 -->
    <v-card-actions class="goal-actions">
      <v-spacer></v-spacer>

      <!-- 复盘按钮 -->
      <v-btn
        v-if="isGoalCompleted || isGoalArchived"
        variant="text"
        size="small"
        color="info"
        @click="reviewGoal"
      >
        <v-icon left size="16">mdi-clipboard-text</v-icon>
        复盘
      </v-btn>

      <!-- 查看详情 -->
      <v-btn variant="text" size="small" color="info" @click="goToGoalDetailView">
        <v-icon left size="16">mdi-eye</v-icon>
        查看详情
      </v-btn>

      <!-- 编辑按钮 -->
      <v-btn variant="text" size="small" color="primary" @click="editGoal">
        <v-icon left size="16">mdi-pencil</v-icon>
        编辑
      </v-btn>

      <!-- 删除按钮 -->
      <v-btn variant="text" size="small" color="error" @click="deleteGoal">
        <v-icon left size="16">mdi-delete</v-icon>
        删除
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, defineExpose } from 'vue';
import type { Goal, KeyResult } from '@dailyuse/goal/domain-client';
import { format } from 'date-fns';
import { useRouter } from 'vue-router';
import { useGoal } from '../../composables/useGoal';

const router = useRouter();
const goalComposable = useGoal();

const props = defineProps<{
  goal: Goal;
}>();

// 定义 emits
const emit = defineEmits<{
  'edit-goal': [goal: Goal];
  'delete-goal': [goalUuid: string];
  'toggle-status': [goalUuid: string];
}>();

// 内部状态控制
const isCardOpen = ref(false);

// ===== 内部业务逻辑方法 =====

/**
 * 编辑目标 - 通过事件通知父组件
 * 编辑目标 - 通过事件通知父组件
 */
const editGoal = async () => {
  try {
    emit('edit-goal', props.goal);
    emit('edit-goal', props.goal);
  } catch (error) {
    console.error('Failed to emit edit event:', error);
    console.error('Failed to emit edit event:', error);
  }
};

/**
 * 删除目标 - 通过事件通知父组件（已有 delete-goal 事件）
 * 删除目标 - 通过事件通知父组件（已有 delete-goal 事件）
 */
const deleteGoal = async () => {
  emit('delete-goal', props.goal.uuid);
  emit('delete-goal', props.goal.uuid);
};

/**
 * 创建复盘
 */
const reviewGoal = async () => {
  try {
    // 导航到复盘页面或打开复盘对话框
    router.push({
      name: 'goal-review',
      params: { goalUuid: props.goal.uuid },
    });
  } catch (error) {
    console.error('Failed to open goal review:', error);
  }
};

/**
 * 打开卡片详情 - 可供外部调用的方法
 */
const openCard = () => {
  isCardOpen.value = true;
  goToGoalDetailView();
};

/**
 * 关闭卡片
 */
const closeCard = () => {
  isCardOpen.value = false;
};

// 暴露方法给父组件
defineExpose({
  openCard,
  closeCard,
});

// ===== 计算属性 =====

// 使用 Goal 自带的计算属性
// 使用 Goal 自带的计算属性
const goalProgress = computed(() => {
  return props.goal.overallProgress;
});

const isGoalArchived = computed(() => {
  return props.goal.isArchived;
});

const isGoalCompleted = computed(() => {
  return props.goal.isCompleted;
});

const remainingDays = computed(() => {
  return props.goal.daysRemaining ?? 0;
});

// 关键结果完成数量
const completedKeyResultsCount = computed(() => {
  return props.goal.completedKeyResultCount;
});

// ===== 视图导航方法 =====

const goToGoalDetailView = () => {
  router.push({ name: 'goal-detail', params: { id: props.goal.uuid } });
};

// ===== 状态显示方法 =====

const getStatusColor = () => {
  if (isGoalCompleted.value) return 'success';
  if (isGoalArchived.value) return 'error';
  if (props.goal.isOverdue) return 'error';
  if (remainingDays.value < 7) return 'warning';
  return 'primary';
};

const getStatusIcon = () => {
  if (isGoalCompleted.value) return 'mdi-check-circle';
  if (isGoalArchived.value) return 'mdi-archive';
  if (props.goal.isOverdue) return 'mdi-alert-circle';
  if (remainingDays.value < 7) return 'mdi-clock-alert';
  return 'mdi-play-circle';
};

const getStatusText = () => {
  return props.goal.statusText;
};

const getRemainingDaysColor = () => {
  if (isGoalCompleted.value) return 'success';
  if (isGoalArchived.value) return 'error';
  if (props.goal.isOverdue) return 'error';
  if (remainingDays.value < 7) return 'warning';
  if (remainingDays.value < 30) return 'orange';
  return 'primary';
};

const getRemainingDaysText = () => {
  if (isGoalCompleted.value) return '已完成';
  if (isGoalArchived.value) return '已归档';
  if (props.goal.isOverdue) return '已逾期';
  return `${remainingDays.value} 天`;
};

const getKeyResultsCount = () => {
  return props.goal.keyResultCount;
};
</script>

<style scoped>
.goal-card {
  border-radius: 16px;
  background: rgb(var(--v-theme-surface));
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}

.goal-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  border-left-width: 6px !important;
}

.progress-ring {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.progress-bar {
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* 渐变背景效果 */
.goal-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--goal-color, transparent), transparent);
  opacity: 0.5;
}
</style>
