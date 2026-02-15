<template>
  <v-card class="critical-path-panel">
    <v-card-title class="d-flex justify-space-between align-center">
      <div>
        <v-icon class="mr-2" color="primary">mdi-timeline</v-icon>
        关键路径分析
      </div>
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-information"
        @click="showHelp = !showHelp"
      >
        帮助
      </v-btn>
    </v-card-title>

    <!-- 帮助说明 -->
    <v-expand-transition>
      <v-alert
        v-if="showHelp"
        type="info"
        density="compact"
        closable
        @click:close="showHelp = false"
        class="ma-4"
      >
        <div class="text-body-2">
          <strong>关键路径</strong>是决定项目最短完成时间的任务序列。<br />
          <strong>松弛时间</strong>是任务可以延迟而不影响项目工期的时间。<br />
          关键任务的松弛时间为 0，优先完成这些任务可以确保项目按时交付。
        </div>
      </v-alert>
    </v-expand-transition>

    <v-card-text v-if="!result">
      <v-alert type="warning" density="compact">
        <div class="text-body-2">请添加任务依赖关系以计算关键路径。</div>
      </v-alert>
    </v-card-text>

    <v-card-text v-else>
      <!-- 项目统计 -->
      <v-row>
        <v-col cols="6" md="3">
          <v-card variant="tonal" color="primary">
            <v-card-text class="text-center py-4">
              <div class="text-h4 font-weight-bold">
                {{ formatDuration(result.projectDuration) }}
              </div>
              <div class="text-caption mt-1">预计总工期</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card variant="tonal" color="error">
            <v-card-text class="text-center py-4">
              <div class="text-h4 font-weight-bold">
                {{ result.criticalTasks.length }}
              </div>
              <div class="text-caption mt-1">关键任务数</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card variant="tonal" color="success">
            <v-card-text class="text-center py-4">
              <div class="text-h4 font-weight-bold">
                {{
                  timeline.criticalTaskCount > 0
                    ? ((result.criticalTasks.length / timeline.criticalTaskCount) * 100).toFixed(0)
                    : 0
                }}%
              </div>
              <div class="text-caption mt-1">关键任务占比</div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="6" md="3">
          <v-card variant="tonal" color="info">
            <v-card-text class="text-center py-4">
              <div class="text-h4 font-weight-bold">
                {{ formatDuration(timeline.averageSlack) }}
              </div>
              <div class="text-caption mt-1">平均松弛时间</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- 关键路径任务列表 -->
      <v-card class="mt-4" variant="outlined">
        <v-card-title class="text-subtitle-1 bg-error-lighten-5">
          <v-icon class="mr-2" color="error">mdi-alert-circle</v-icon>
          关键路径任务 ({{ result.criticalTasks.length }})
        </v-card-title>

        <v-card-text class="pa-0">
          <v-list density="compact">
            <v-list-item
              v-for="(task, index) in result.criticalTasks"
              :key="task.uuid"
              class="border-b"
            >
              <template #prepend>
                <v-avatar color="error" size="32">
                  <span class="text-subtitle-2">{{ index + 1 }}</span>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ task.title }}
              </v-list-item-title>

              <v-list-item-subtitle>
                <div class="d-flex gap-2 align-center">
                  <v-chip size="x-small" color="primary" variant="flat">
                    工期: {{ formatDuration(task.estimatedMinutes || 0) }}
                  </v-chip>
                  <v-chip size="x-small" color="error" variant="flat"> 松弛: 0 min </v-chip>

                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-icon v-bind="props" size="small" class="ml-1"> mdi-information </v-icon>
                    </template>
                    <div>
                      <div>
                        最早开始: {{ formatDuration(getTiming(task.uuid)?.earliestStart || 0) }}
                      </div>
                      <div>
                        最晚开始: {{ formatDuration(getTiming(task.uuid)?.latestStart || 0) }}
                      </div>
                    </div>
                  </v-tooltip>
                </div>
              </v-list-item-subtitle>

              <template #append v-if="index < result.criticalTasks.length - 1">
                <v-icon color="error">mdi-arrow-down</v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>

      <!-- 非关键任务 -->
      <v-expansion-panels class="mt-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <div>
              <v-icon class="mr-2">mdi-clock-outline</v-icon>
              非关键任务 ({{ nonCriticalTasks.length }})
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact">
              <v-list-item v-for="task in nonCriticalTasks" :key="task.uuid">
                <template #prepend>
                  <v-icon :color="getSlackColor(getTiming(task.uuid)?.slack || 0)">
                    mdi-checkbox-marked-circle
                  </v-icon>
                </template>

                <v-list-item-title>
                  {{ task.title }}
                </v-list-item-title>

                <v-list-item-subtitle>
                  <div class="d-flex gap-2">
                    <v-chip size="x-small" variant="flat">
                      工期: {{ formatDuration(task.estimatedMinutes || 0) }}
                    </v-chip>
                    <v-chip
                      size="x-small"
                      :color="getSlackColor(getTiming(task.uuid)?.slack || 0)"
                      variant="flat"
                    >
                      松弛: {{ formatDuration(getTiming(task.uuid)?.slack || 0) }}
                    </v-chip>
                  </div>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- 优化建议 -->
      <v-expansion-panels class="mt-4" v-if="result.suggestions.length > 0">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <div>
              <v-icon class="mr-2" color="warning">mdi-lightbulb</v-icon>
              优化建议 ({{ result.suggestions.length }})
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list>
              <v-list-item v-for="(suggestion, index) in result.suggestions" :key="index">
                <template #prepend>
                  <v-icon :color="getPriorityColor(suggestion.priority)">
                    {{ getSuggestionIcon(suggestion.type) }}
                  </v-icon>
                </template>

                <v-list-item-title>
                  {{ suggestion.description }}
                </v-list-item-title>

                <v-list-item-subtitle>
                  <v-chip
                    size="x-small"
                    :color="getPriorityColor(suggestion.priority)"
                    variant="flat"
                    class="mr-2"
                  >
                    {{ getPriorityText(suggestion.priority) }}
                  </v-chip>
                  <v-chip size="x-small" color="success" variant="flat">
                    可节省: {{ formatDuration(suggestion.impact) }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <!-- 导出选项 -->
      <div class="mt-4 text-center">
        <v-btn color="primary" variant="outlined" prepend-icon="mdi-download" @click="handleExport">
          导出报告
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { TaskForDAG } from '@/modules/task/types/task-dag.types';
import type {
  CriticalPathResult,
  ProjectTimeline,
  TaskTiming,
} from '@/modules/task/application/services/TaskCriticalPathService';

interface Props {
  result: CriticalPathResult | null;
  allTasks: TaskForDAG[];
}

const props = defineProps<Props>();

const showHelp = ref(false);

// Computed
const timeline = computed((): ProjectTimeline => {
  if (!props.result) {
    return {
      totalDuration: 0,
      criticalTaskCount: 0,
      totalSlack: 0,
      averageSlack: 0,
    };
  }

  const timings = Array.from(props.result.taskTimings.values());
  const totalSlack = timings.reduce((sum, t) => sum + t.slack, 0);
  const averageSlack = timings.length > 0 ? totalSlack / timings.length : 0;

  return {
    totalDuration: props.result.projectDuration,
    criticalTaskCount: props.allTasks.length,
    totalSlack,
    averageSlack,
  };
});

const nonCriticalTasks = computed(() => {
  if (!props.result) return [];

  const criticalUuids = new Set(props.result.criticalPath);
  return props.allTasks.filter((task) => !criticalUuids.has(task.uuid));
});

// Methods
const getTiming = (taskUuid: string): TaskTiming | undefined => {
  return props.result?.taskTimings.get(taskUuid);
};

const formatDuration = (minutes: number): string => {
  if (minutes === 0) return '0 min';

  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

const getSlackColor = (slack: number): string => {
  if (slack === 0) return 'error';
  if (slack < 60) return 'warning';
  if (slack < 180) return 'info';
  return 'success';
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    high: 'error',
    medium: 'warning',
    low: 'info',
  };
  return colors[priority] || 'default';
};

const getPriorityText = (priority: string): string => {
  const texts: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  };
  return texts[priority] || priority;
};

const getSuggestionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    reduce_duration: 'mdi-timer-sand',
    parallelize: 'mdi-arrow-split-horizontal',
    remove_dependency: 'mdi-link-variant-off',
  };
  return icons[type] || 'mdi-lightbulb';
};

const handleExport = () => {
  if (!props.result) return;

  // 生成 JSON 报告
  const report = {
    projectDuration: props.result.projectDuration,
    criticalTasks: props.result.criticalTasks.map((task) => ({
      uuid: task.uuid,
      title: task.title,
      duration: task.estimatedMinutes,
      timing: getTiming(task.uuid),
    })),
    suggestions: props.result.suggestions,
    timeline,
    exportedAt: new Date().toISOString(),
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `critical-path-report-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.border-b {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.border-b:last-child {
  border-bottom: none;
}

.gap-2 {
  gap: 8px;
}
</style>
