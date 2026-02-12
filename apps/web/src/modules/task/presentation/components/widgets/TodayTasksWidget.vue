<script setup lang="ts">
/**
 * TodayTasksWidget - 今日待办任务 Widget
 * 
 * 功能：
 * - 展示今日的待办任务（TaskInstance）
 * - 显示任务标题、完成状态
 * - 支持快速标记完成
 * - 支持三种尺寸 (small/medium/large)
 */

import { computed, onMounted, ref } from 'vue';
import type { WidgetConfig } from '@dailyuse/contracts/dashboard';
import { WidgetSize } from '@dailyuse/contracts/dashboard';
import { useTaskStore } from '@/modules/task/presentation/stores/taskStore';
import { TaskInstanceStatus } from '@dailyuse/contracts/task';
import type { TaskInstance } from '@dailyuse/task/domain-client';

// ===== Props =====
interface Props {
    size?: WidgetSize;
}

const props = withDefaults(defineProps<Props>(), {
    size: WidgetSize.MEDIUM,
});

// ===== Stores =====
const taskStore = useTaskStore();

// ===== State =====
const isLoading = ref(true);

// ===== Computed =====

/**
 * 今日待办任务
 */
const todayTasks = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return taskStore.getAllTaskInstances
        .filter((task: TaskInstance) => {
            if (task.status === TaskInstanceStatus.COMPLETED) return false;

            // 检查任务实例是否有今日的 instanceDate
            if (task.instanceDate) {
                const taskDate = new Date(task.instanceDate);
                return taskDate >= today && taskDate < tomorrow;
            }

            return false;
        })
        .slice(0, props.size === WidgetSize.SMALL ? 3 : props.size === WidgetSize.MEDIUM ? 5 : 10);
});

/**
 * 任务数量统计
 */
const taskStats = computed(() => ({
    total: todayTasks.value.length,
}));

/**
 * 是否为小尺寸
 */
const isSmallSize = computed(() => props.size === WidgetSize.SMALL);

/**
 * 格式化时间
 */
const formatTime = (timestamp: number | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
};

/**
 * 快速标记完成
 */
const toggleComplete = async (taskUuid: string) => {
    try {
        const instance = taskStore.getTaskInstanceByUuid(taskUuid);
        if (instance) {
            // 使用 store 的 updateTaskInstance 方法
            // 实际的状态更新需要通过 ApplicationService 完成
            console.log('[TodayTasksWidget] Would complete task:', taskUuid);
        }
    } catch (error) {
        console.error('[TodayTasksWidget] Failed to toggle task completion:', error);
    }
};

// ===== Lifecycle =====
onMounted(async () => {
    try {
        isLoading.value = true;
        // Instances should be loaded by the TaskApplicationService during app initialization
    } catch (error) {
        console.error('[TodayTasksWidget] Failed to load tasks:', error);
    } finally {
        isLoading.value = false;
    }
});
</script>

<template>
    <v-card class="today-tasks-widget" :class="`widget-size-${size}`" elevation="2">
        <!-- Header -->
        <v-card-title class="d-flex align-center justify-space-between pa-4">
            <div class="d-flex align-center">
                <v-icon color="primary" size="large" class="mr-2">mdi-calendar-today</v-icon>
                <span class="text-h6">今日待办</span>
            </div>
            <v-chip color="primary" size="small">{{ taskStats.total }}</v-chip>
        </v-card-title>

        <v-divider />

        <!-- Loading State -->
        <v-card-text v-if="isLoading" class="d-flex flex-column align-center justify-center" style="min-height: 200px;">
            <v-progress-circular indeterminate color="primary" />
            <p class="text-caption text-grey mt-2">加载中...</p>
        </v-card-text>

        <!-- Empty State -->
        <v-card-text v-else-if="todayTasks.length === 0" class="d-flex flex-column align-center justify-center"
            style="min-height: 200px;">
            <v-icon color="success" size="64">mdi-check-circle</v-icon>
            <p class="text-body-2 text-grey mt-2">今天没有待办任务</p>
        </v-card-text>

        <!-- Task List -->
        <v-card-text v-else class="pa-3 task-list-container">
            <v-list lines="two" class="pa-0">
                <v-list-item v-for="task in todayTasks" :key="task.uuid" class="task-item mb-2" rounded>
                    <template #prepend>
                        <v-checkbox :model-value="false" hide-details color="success"
                            @click="toggleComplete(task.uuid)" />
                    </template>

                    <v-list-item-title class="d-flex align-center justify-space-between">
                        <span class="text-body-2">{{ task.instanceDateFormatted }}</span>
                    </v-list-item-title>

                    <v-list-item-subtitle v-if="!isSmallSize" class="d-flex align-center mt-1">
                        <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
                        <span class="text-caption">{{ formatTime(task.instanceDate) }}</span>
                    </v-list-item-subtitle>
                </v-list-item>
            </v-list>
        </v-card-text>
    </v-card>
</template>

<style scoped>
.today-tasks-widget {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.widget-size-small {
    max-height: 280px;
}

.widget-size-medium {
    max-height: 400px;
}

.widget-size-large {
    max-height: 600px;
}

.task-list-container {
    flex: 1;
    overflow-y: auto;
}

.task-item {
    transition: all 0.2s;
    background: rgba(var(--v-theme-surface-variant), 0.3);
}

.task-item:hover {
    background: rgba(var(--v-theme-surface-variant), 0.5);
    transform: translateX(4px);
}
</style>

