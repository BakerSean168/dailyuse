<template>
  <v-card v-if="blockingTasks.length > 0" class="blocked-task-info" outlined>
    <v-card-title class="text-subtitle-1 pa-3 error lighten-5">
      <v-icon color="error" class="mr-2">mdi-lock</v-icon>
      任务被阻塞
    </v-card-title>

    <v-card-text class="pa-3">
      <p class="text-body-2 mb-3">此任务正在等待以下 {{ blockingTasks.length }} 个前置任务完成：</p>

      <v-list dense>
        <v-list-item v-for="task in blockingTasks" :key="task.uuid" class="px-0">
          <template #prepend>
            <v-icon :color="getStatusColor(task.status)" size="small">
              {{ getStatusIcon(task.status) }}
            </v-icon>
          </template>

          <v-list-item-title>
            {{ task.title }}
          </v-list-item-title>

          <v-list-item-subtitle>
            <v-chip :color="getStatusColor(task.status)" size="x-small" variant="flat" class="mr-2">
              {{ task.status }}
            </v-chip>
            <span v-if="task.estimatedMinutes" class="text-caption">
              预估: {{ formatDuration(task.estimatedMinutes) }}
            </span>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>

      <!-- 进度条 -->
      <div class="mt-3">
        <div class="d-flex justify-space-between text-caption mb-1">
          <span>完成进度</span>
          <span>{{ completedCount }} / {{ totalCount }}</span>
        </div>
        <v-progress-linear
          :model-value="progressPercentage"
          :color="progressColor"
          height="8"
          rounded
        />
      </div>
    </v-card-text>
  </v-card>

  <v-card v-else class="ready-task-info" outlined>
    <v-card-text class="pa-3 d-flex align-center">
      <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
      <div>
        <div class="font-weight-medium">任务已就绪</div>
        <div class="text-caption text--secondary">所有前置任务已完成，可以开始执行</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaskForDAG } from '@/modules/task/types/task-dag.types';

interface BlockingTask {
  uuid: string;
  title: string;
  status: string;
  estimatedMinutes?: number | null;
}

interface Props {
  blockingTasks: BlockingTask[];
  totalPredecessors: number;
}

const props = defineProps<Props>();

const completedCount = computed(() => {
  return props.totalPredecessors - props.blockingTasks.length;
});

const totalCount = computed(() => {
  return props.totalPredecessors;
});

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 100;
  return (completedCount.value / totalCount.value) * 100;
});

const progressColor = computed(() => {
  const percentage = progressPercentage.value;
  if (percentage >= 75) return 'success';
  if (percentage >= 50) return 'info';
  if (percentage >= 25) return 'warning';
  return 'error';
});

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    COMPLETED: 'success',
    IN_PROGRESS: 'primary',
    READY: 'info',
    BLOCKED: 'error',
    PENDING: 'grey',
    CANCELLED: 'grey',
  };
  return colors[status] || 'grey';
};

const getStatusIcon = (status: string): string => {
  const icons: Record<string, string> = {
    COMPLETED: 'mdi-check-circle',
    IN_PROGRESS: 'mdi-progress-clock',
    READY: 'mdi-play-circle',
    BLOCKED: 'mdi-lock',
    PENDING: 'mdi-clock-outline',
    CANCELLED: 'mdi-cancel',
  };
  return icons[status] || 'mdi-help-circle';
};

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};
</script>

<style scoped>
.blocked-task-info,
.ready-task-info {
  margin: 12px 0;
}
</style>
