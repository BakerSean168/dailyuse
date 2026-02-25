<template>
  <v-card class="critical-path-panel">
    <v-card-title class="d-flex justify-space-between align-center">
      <div>
        <v-icon class="mr-2" color="primary">mdi-timeline</v-icon>
        关键路径分析
      </div>
      <v-btn size="small" variant="text" prepend-icon="mdi-download" @click="handleExport">导出</v-btn>
    </v-card-title>

    <v-card-text v-if="!result">
      <v-alert type="warning" density="compact">
        <div class="text-body-2">请添加任务依赖关系以计算关键路径。</div>
      </v-alert>
    </v-card-text>

    <v-card-text v-else>
      <v-row>
        <v-col cols="6" md="3">
          <v-card variant="tonal" color="primary">
            <v-card-text class="text-center py-4">
              <div class="text-h4 font-weight-bold">{{ formatDuration(result.projectDuration) }}</div>
              <div class="text-caption mt-1">预计总工期</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card variant="tonal" color="error">
            <v-card-text class="text-center py-4">
              <div class="text-h4 font-weight-bold">{{ result.criticalTasks.length }}</div>
              <div class="text-caption mt-1">关键任务数</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="mt-4" variant="outlined">
        <v-card-title class="text-subtitle-1 bg-error-lighten-5">
          <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
          关键路径任务 ({{ result.criticalTasks.length }})
        </v-card-title>

        <v-card-text class="pa-0">
          <v-list density="compact">
            <v-list-item v-for="(task, index) in result.criticalTasks" :key="task.id" class="border-b">
              <template #prepend>
                <v-avatar color="error" size="32"><span class="text-subtitle-2">{{ index + 1 }}</span></v-avatar>
              </template>
              <v-list-item-title class="font-weight-medium">{{ task.title }}</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip size="x-small" color="primary" variant="flat">工期: {{ formatDuration(task.estimatedMinutes || 0) }}</v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import type { TaskForDAGViewModel } from '../types';

interface CriticalPathResultViewModel {
  projectDuration: number;
  criticalPath: string[];
  criticalTasks: TaskForDAGViewModel[];
  suggestions: Array<{ type: string; description: string; priority: string; impact: number }>;
}

interface Props {
  result: CriticalPathResultViewModel | null;
  allTasks: TaskForDAGViewModel[];
}

const props = defineProps<Props>();

const formatDuration = (minutes: number): string => {
  if (minutes === 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins}m`;
};

const handleExport = () => {
  if (!props.result) return;
  const report = {
    ...props.result,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `critical-path-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>
