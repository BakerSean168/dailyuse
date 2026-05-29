<script setup lang="ts">
/**
 * GoalTimelineWidget - 目标时间进度 Widget
 *
 * 功能：
 * - 展示目标的时间进度（浅色框 = 时间范围，深色 = 完成百分比）
 * - 显示目标标题、进度百分比、剩余天数
 * - 支持三种尺寸 (small/medium/large)
 */

import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { WidgetSize } from '@dailyuse/contracts/dashboard';
import { useGoal } from '../composables/useGoal';
import { GoalStatus } from '@dailyuse/contracts/goal';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Separator,
  Badge,
  Progress,
} from '@dailyuse/ui-vue-shadcn';
import { TrendingUp, CalendarDays, Flag, FlagOff, ArrowRight, Loader2 } from 'lucide-vue-next';

// ===== Props =====
interface Props {
  size?: WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium' as WidgetSize,
});

// ===== Composables =====
const { t, locale } = useI18n();
const { goals, fetchGoals } = useGoal();

// ===== State =====
const isLoading = ref(true);

// ===== Computed =====

/**
 * 活跃目标列表（有时间范围的进行中目标）
 */
const activeGoals = computed(() => {
  const today = new Date();

  // 使用 composable 提供的响应式数据
  const allGoals = goals.value;
  if (!allGoals || !Array.isArray(allGoals)) {
    return [];
  }

  return allGoals
    .filter((goal) => {
      if (goal.status !== GoalStatus.ACTIVE) return false;
      return goal.startDate && goal.targetDate;
    })
    .map((goal) => {
      const start = new Date(goal.startDate!);
      const end = new Date(goal.targetDate!);
      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const remainingDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // 时间进度百分比
      const timeProgress = Math.min(Math.max((elapsedDays / totalDays) * 100, 0), 100);

      // 实际完成进度（如果有 keyResults）
      let completionProgress = 0;
      if (goal.keyResults && goal.keyResults.length > 0) {
        const completedKRs = goal.keyResults.filter(
          (kr: { isCompleted?: boolean }) => kr.isCompleted,
        ).length;
        completionProgress = (completedKRs / goal.keyResults.length) * 100;
      }

      return {
        id: goal.id,
        name: goal.name,
        startDate: goal.startDate!,
        targetDate: goal.targetDate!,
        totalDays,
        elapsedDays: Math.max(elapsedDays, 0),
        remainingDays: Math.max(remainingDays, 0),
        timeProgress,
        completionProgress,
        isOverdue: remainingDays < 0,
        isWarning: remainingDays >= 0 && remainingDays <= 7,
      };
    })
    .sort((a, b) => {
      // 优先显示即将到期的
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      if (a.isWarning && !b.isWarning) return -1;
      if (!a.isWarning && b.isWarning) return 1;
      return a.remainingDays - b.remainingDays;
    })
    .slice(0, props.size === 'small' ? 3 : props.size === 'medium' ? 5 : 8);
});

/**
 * 是否为小尺寸
 */
const isSmallSize = computed(() => props.size === 'small');

/**
 * 获取进度条颜色类
 */
const getProgressColorClass = (goal: (typeof activeGoals.value)[0]) => {
  if (goal.isOverdue) return 'bg-destructive';
  if (goal.isWarning) return 'bg-warning';
  if (goal.completionProgress >= 80) return 'bg-success';
  return 'bg-primary';
};

/**
 * 获取进度条背景色类
 */
const getProgressBgClass = (goal: (typeof activeGoals.value)[0]) => {
  if (goal.isOverdue) return 'bg-destructive/20';
  if (goal.isWarning) return 'bg-warning/20';
  if (goal.completionProgress >= 80) return 'bg-success/20';
  return 'bg-primary/20';
};

/**
 * 获取 Badge variant
 */
const getBadgeVariant = (goal: (typeof activeGoals.value)[0]) => {
  if (goal.isOverdue) return 'destructive' as const;
  if (goal.isWarning) return 'secondary' as const;
  return 'outline' as const;
};

/**
 * 格式化日期
 */
const formatDate = (value: number) => {
  const date = new Date(value);
  return date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' });
};

// ===== Lifecycle =====
onMounted(async () => {
  try {
    isLoading.value = true;
    await fetchGoals();
  } catch (error) {
    console.error('[GoalTimelineWidget] Failed to load goals:', error);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <Card class="goal-timeline-widget" :class="`widget-size-${size}`">
    <!-- Header -->
    <CardHeader class="flex flex-row items-center justify-between p-4">
      <div class="flex items-center gap-2">
        <TrendingUp class="h-6 w-6 text-purple-500" />
        <CardTitle class="text-lg">{{ t('goal.timeline.widget.title') }}</CardTitle>
      </div>
      <Badge variant="default" class="bg-purple-500 hover:bg-purple-500/80">
        {{ activeGoals.length }}
      </Badge>
    </CardHeader>

    <Separator />

    <!-- Loading State -->
    <CardContent v-if="isLoading" class="flex flex-col items-center justify-center min-h-[200px]">
      <Loader2 class="h-8 w-8 animate-spin text-purple-500" />
      <p class="text-xs text-muted-foreground mt-2">{{ t('goal.timeline.widget.loading') }}</p>
    </CardContent>

    <!-- Empty State -->
    <CardContent
      v-else-if="activeGoals.length === 0"
      class="flex flex-col items-center justify-center min-h-[200px]"
    >
      <FlagOff class="h-16 w-16 text-muted-foreground" />
      <p class="text-sm text-muted-foreground mt-2">{{ t('goal.timeline.widget.empty') }}</p>
    </CardContent>

    <!-- Goal Timeline List -->
    <CardContent v-else class="p-3 goal-list-container">
      <div v-for="goal in activeGoals" :key="goal.id" class="goal-item mb-3 p-3">
        <!-- Goal Header -->
        <div class="flex items-start justify-between mb-2">
          <span class="text-sm font-bold flex-1">{{ goal.name }}</span>
          <Badge :variant="getBadgeVariant(goal)" class="ml-2 shrink-0">
            {{
              goal.isOverdue
                ? `${t('goal.timeline.widget.overdue')} ${Math.abs(goal.remainingDays)}${t('goal.comparison.dayUnit')}`
                : `${t('goal.timeline.widget.remaining')}${goal.remainingDays}${t('goal.comparison.dayUnit')}`
            }}
          </Badge>
        </div>

        <!-- Progress Bar Container -->
        <div class="mb-2 relative">
          <Progress
            :model-value="goal.timeProgress"
            class="h-6 w-full"
            :class="getProgressBgClass(goal)"
          />
          <!-- Custom indicator overlay for colored bar -->
          <div class="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div
              class="h-full transition-all rounded-full"
              :class="getProgressColorClass(goal)"
              :style="{ width: `${goal.timeProgress}%` }"
            />
          </div>
          <!-- Text overlay -->
          <div class="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
            <span class="text-xs font-bold text-white drop-shadow-sm">
              {{ t('goal.timeline.widget.completed') }} {{ Math.round(goal.completionProgress) }}%
            </span>
            <span class="text-xs text-white drop-shadow-sm">
              {{ t('goal.timeline.widget.time') }} {{ Math.round(goal.timeProgress) }}%
            </span>
          </div>
        </div>

        <!-- Dates (Medium/Large only) -->
        <div
          v-if="!isSmallSize"
          class="flex items-center justify-between text-xs text-muted-foreground"
        >
          <div class="flex items-center gap-1">
            <CalendarDays class="h-3 w-3" />
            {{ formatDate(goal.startDate) }}
          </div>
          <ArrowRight class="h-3 w-3" />
          <div class="flex items-center gap-1">
            <Flag class="h-3 w-3" />
            {{ formatDate(goal.targetDate) }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<style scoped>
.goal-timeline-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-size-small {
  max-height: 300px;
}

.widget-size-medium {
  max-height: 500px;
}

.widget-size-large {
  max-height: 700px;
}

.goal-list-container {
  flex: 1;
  overflow-y: auto;
}

.goal-item {
  border-radius: 8px;
  transition: all 0.2s;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
}

.goal-item:hover {
  background: hsl(var(--muted) / 0.8);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>
