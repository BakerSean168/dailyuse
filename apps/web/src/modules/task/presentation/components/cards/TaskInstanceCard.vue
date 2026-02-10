<template>
  <v-list-item
    :key="task.uuid"
    class="task-item"
    :class="{ 'border-bottom': showBorder, 'completed-task': isCompleted }"
  >
    <template v-slot:prepend>
      <!-- 未完成任务：显示完成按钮 -->
      <v-btn
        v-if="!isCompleted"
        icon
        variant="text"
        color="success"
        @click="$emit('complete', task.uuid)"
        class="complete-btn"
      >
        <v-icon>mdi-circle-outline</v-icon>
      </v-btn>
      <!-- 已完成任务：显示完成图标 -->
      <v-icon v-else color="success" class="complete-icon"> mdi-check-circle </v-icon>
    </template>

    <div class="task-content-wrapper">
      <v-list-item-title :class="['task-title', { completed: isCompleted }]">
        {{ taskTitle }}
      </v-list-item-title>

      <v-list-item-subtitle class="task-meta">
        <v-icon size="small" class="mr-1">{{
          isCompleted ? 'mdi-check' : 'mdi-clock-outline'
        }}</v-icon>
        <span v-if="!isCompleted">{{ timeLabel }}</span>
        <span v-else>完成于 {{ formatCompletionTime }}</span>
      </v-list-item-subtitle>
    </div>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { format } from 'date-fns';
import type { TaskInstance } from '@dailyuse/task/domain-client';
import { useTaskStore } from '../../stores/taskStore';

// Props
interface Props {
  task: TaskInstance;
  showBorder?: boolean;
  goalStore?: any; // 可以通过 props 传入 goalStore，或者使用全局 store
}

const props = withDefaults(defineProps<Props>(), {
  showBorder: true,
});

// Emits
const emit = defineEmits<{
  complete: [uuid: string];
}>();

// Store
const taskStore = useTaskStore();

// Computed
const isCompleted = computed(() => props.task.isCompleted);

/**
 * 从模板获取任务标题
 */
const taskTitle = computed(() => {
  const template = taskStore.getTaskTemplateByUuid(props.task.templateUuid);
  return template?.title || '未知任务';
});

const formatCompletionTime = computed(() => {
  return props.task.actualEndTime ? format(props.task.actualEndTime, 'HH:mm') : '';
});

/**
 * 根据时间类型生成时间标签
 * - ALL_DAY: 全天
 * - TIME_POINT: HH:mm
 * - TIME_RANGE: HH:mm - HH:mm
 */
const timeLabel = computed(() => {
  const timeConfig = props.task.timeConfig;
  
  if (timeConfig.timeType === 'ALL_DAY') {
    return '全天';
  }
  
  if (timeConfig.timeType === 'TIME_POINT' && timeConfig.timePoint !== null) {
    const hours = Math.floor(timeConfig.timePoint / 60);
    const minutes = timeConfig.timePoint % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
  
  if (timeConfig.timeType === 'TIME_RANGE' && timeConfig.timeRange) {
    const startHours = Math.floor(timeConfig.timeRange.start / 60);
    const startMinutes = timeConfig.timeRange.start % 60;
    const endHours = Math.floor(timeConfig.timeRange.end / 60);
    const endMinutes = timeConfig.timeRange.end % 60;
    
    const startTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
    const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    
    return `${startTime} - ${endTime}`;
  }
  
  return '全天';
});

// 这里需要 goalStore 来获取关键结果名称
// 如果没有传入 goalStore，可以通过 composable 或全局 store 获取
const getKeyResultName = (binding: any) => {
  if (!props.goalStore || !binding) return '';

  const goal = props.goalStore.getGoalByUuid(binding.goalUuid);
  const kr = goal?.keyResults.find((k: any) => k.uuid === binding.keyResultUuid);
  return kr?.title || '';
};
</script>

<style scoped>
.task-item {
  padding: 1.25rem 1.5rem;
  transition: all 0.2s ease;
  min-height: 80px;
}

.task-item:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.task-item.border-bottom {
  border-bottom: 1px solid rgba(var(--v-theme-outline), 0.08);
}

.task-content-wrapper {
  flex: 1;
  min-width: 0;
}

.complete-btn,
.undo-btn {
  transition: all 0.2s ease;
}

.complete-btn:hover {
  background: rgba(var(--v-theme-success), 0.1);
  transform: scale(1.1);
}

.task-title {
  font-weight: 600;
  font-size: 1rem;
  line-height: 1.4;
}

.task-title.completed {
  text-decoration: line-through;
  opacity: 0.7;
}

.task-meta {
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.completed-task {
  opacity: 0.8;
}

.complete-icon {
  margin-left: 8px;
}

/* 关键结果链接 */
.key-results {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: 0.5rem;
}
</style>

