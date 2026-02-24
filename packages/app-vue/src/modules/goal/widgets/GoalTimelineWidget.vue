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
import { WidgetSize, type WidgetConfig } from '@dailyuse/contracts/dashboard';
import { useGoal } from '../composables/useGoal';
import { GoalStatus } from '@dailyuse/contracts/goal';

// ===== Props =====
interface Props {
    size?: WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
    size: 'medium' as WidgetSize,
});

// ===== Composables =====
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
        .filter(goal => {
            if (goal.status !== GoalStatus.ACTIVE) return false;
            return goal.startDate && goal.targetDate;
        })
        .map(goal => {
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
                const completedKRs = goal.keyResults.filter((kr: { isCompleted?: boolean }) => kr.isCompleted).length;
                completionProgress = (completedKRs / goal.keyResults.length) * 100;
            }

            return {
                uuid: goal.uuid,
                title: goal.title,
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
 * 获取进度条颜色
 */
const getProgressColor = (goal: typeof activeGoals.value[0]) => {
    if (goal.isOverdue) return 'error';
    if (goal.isWarning) return 'warning';
    if (goal.completionProgress >= 80) return 'success';
    return 'primary';
};

/**
 * 获取芯片颜色
 */
const getChipColor = (goal: typeof activeGoals.value[0]) => {
    if (goal.isOverdue) return 'error';
    if (goal.isWarning) return 'warning';
    return 'info';
};

/**
 * 格式化日期
 */
const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
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
    <v-card class="goal-timeline-widget" :class="`widget-size-${size}`" elevation="2">
        <!-- Header -->
        <v-card-title class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
                <v-icon color="purple" size="large" class="mr-2">mdi-chart-timeline-variant</v-icon>
                <span class="text-h6">目标进度</span>
            </div>
            <v-chip color="purple" size="small">{{ activeGoals.length }}</v-chip>
        </v-card-title>

        <v-divider />

        <!-- Loading State -->
        <v-card-text v-if="isLoading" class="d-flex flex-column align-center justify-center" style="min-height: 200px;">
            <v-progress-circular indeterminate color="purple" />
            <p class="text-caption text-grey mt-2">加载中...</p>
        </v-card-text>

        <!-- Empty State -->
        <v-card-text v-else-if="activeGoals.length === 0" class="d-flex flex-column align-center justify-center"
            style="min-height: 200px;">
            <v-icon color="grey" size="64">mdi-flag-outline</v-icon>
            <p class="text-body-2 text-grey mt-2">暂无进行中的目标</p>
        </v-card-text>

        <!-- Goal Timeline List -->
        <v-card-text v-else class="pa-3 goal-list-container">
            <div v-for="goal in activeGoals" :key="goal.uuid" class="goal-item mb-3 pa-3">
                <!-- Goal Header -->
                <div class="d-flex align-start justify-space-between mb-2">
                    <span class="text-body-2 font-weight-bold flex-grow-1">{{ goal.title }}</span>
                    <v-chip :color="getChipColor(goal)" size="x-small" class="ml-2">
                        {{ goal.isOverdue ? `超期 ${Math.abs(goal.remainingDays)}天` : `剩${goal.remainingDays}天` }}
                    </v-chip>
                </div>

                <!-- Progress Bar Container -->
                <div class="mb-2">
                    <v-progress-linear :model-value="goal.timeProgress" :color="getProgressColor(goal)" height="24"
                        rounded>
                        <template #default>
                            <div class="d-flex justify-space-between align-center w-100 px-2">
                                <span class="text-caption font-weight-bold">完成 {{ Math.round(goal.completionProgress)
                                    }}%</span>
                                <span class="text-caption">时间 {{ Math.round(goal.timeProgress) }}%</span>
                            </div>
                        </template>
                    </v-progress-linear>
                </div>

                <!-- Dates (Medium/Large only) -->
                <div v-if="!isSmallSize" class="d-flex align-center justify-space-between text-caption text-grey">
                    <div class="d-flex align-center">
                        <v-icon size="x-small" class="mr-1">mdi-calendar-start</v-icon>
                        {{ formatDate(goal.startDate) }}
                    </div>
                    <v-icon size="x-small">mdi-arrow-right</v-icon>
                    <div class="d-flex align-center">
                        <v-icon size="x-small" class="mr-1">mdi-flag</v-icon>
                        {{ formatDate(goal.targetDate) }}
                    </div>
                </div>
            </div>
        </v-card-text>
    </v-card>
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
    background: rgba(var(--v-theme-surface-variant), 0.3);
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.goal-item:hover {
    background: rgba(var(--v-theme-surface-variant), 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>


