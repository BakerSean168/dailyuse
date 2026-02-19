<template>
  <v-card class="task-dependency-graph" elevation="2">
    <!-- 工具栏 -->
    <v-card-title class="d-flex align-center justify-space-between">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-graph-outline</v-icon>
        <span>任务依赖关系图</span>
      </div>
      <div class="d-flex align-center gap-2">
        <!--布局切换 -->
        <v-btn-toggle v-model="layoutType" mandatory density="compact" variant="outlined">
          <v-btn value="force" size="small">
            <v-icon>mdi-chart-scatter-plot</v-icon>
            <v-tooltip activator="parent" location="bottom">力导向布局</v-tooltip>
          </v-btn>
          <v-btn value="circular" size="small">
            <v-icon>mdi-chart-donut</v-icon>
            <v-tooltip activator="parent" location="bottom">环形布局</v-tooltip>
          </v-btn>
        </v-btn-toggle>

        <!-- 关键路径切换 -->
        <v-switch
          v-model="showCriticalPath"
          hide-details
          density="compact"
          color="error"
          label="关键路径"
        />

        <!-- 刷新按钮 -->
        <v-btn
          icon="mdi-refresh"
          size="small"
          variant="text"
          @click="refreshGraph"
          :loading="loading"
        />
      </div>
    </v-card-title>

    <!-- 图表容器 -->
    <v-card-text>
      <div v-if="loading" class="d-flex justify-center align-center" style="height: 500px">
        <v-progress-circular indeterminate color="primary" size="64" />
      </div>

      <div v-else-if="error" class="text-center py-8">
        <v-icon size="64" color="error">mdi-alert-circle</v-icon>
        <p class="text-h6 mt-4">{{ error }}</p>
        <v-btn color="primary" @click="refreshGraph">重试</v-btn>
      </div>

      <div v-else-if="!hasData" class="text-center py-8">
        <v-icon size="64" color="grey">mdi-graph-outline</v-icon>
        <p class="text-h6 mt-4">暂无任务依赖数据</p>
        <p class="text-body-2 text-grey">创建任务并添加依赖关系后，这里将显示依赖关系图</p>
      </div>

      <div v-else ref="chartContainer" :style="{ height: chartHeight + 'px' }" />
    </v-card-text>

    <!-- 图例和统计 -->
    <v-card-text v-if="hasData && !loading" class="pt-0">
      <v-divider class="mb-4" />
      
      <v-row dense>
        <!-- 统计信息 -->
        <v-col cols="12" md="6">
          <div class="text-subtitle-2 mb-2">统计信息</div>
          <v-chip class="mr-2" size="small" label>
            <v-icon start>mdi-checkbox-multiple-marked</v-icon>
            {{ graphStats.totalTasks }} 个任务
          </v-chip>
          <v-chip class="mr-2" size="small" label>
            <v-icon start>mdi-arrow-right</v-icon>
            {{ graphStats.totalDependencies }} 个依赖
          </v-chip>
          <v-chip v-if="graphStats.hasCycle" color="error" size="small" label>
            <v-icon start>mdi-alert</v-icon>
            检测到循环依赖
          </v-chip>
        </v-col>

        <!-- 关键路径信息 -->
        <v-col v-if="showCriticalPath && criticalPathInfo" cols="12" md="6">
          <div class="text-subtitle-2 mb-2">关键路径</div>
          <v-chip class="mr-2" size="small" label color="error">
            <v-icon start>mdi-timer</v-icon>
            总工期：{{ formatDuration(criticalPathInfo.duration) }}
          </v-chip>
          <v-chip size="small" label color="error">
            <v-icon start>mdi-road</v-icon>
            {{ criticalPathInfo.path.length }} 个关键任务
          </v-chip>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import type { TaskTemplateClientDTO, TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import type { TaskForDAGViewModel } from './types';

type TaskClientDTO = TaskTemplateClientDTO & TaskForDAGViewModel;

// Props
interface Props {
  tasks: TaskClientDTO[];
  dependencies: TaskDependencyClientDTO[];
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  height: 600,
});

const adjacency = computed(() => {
  const map = new Map<string, string[]>();
  props.tasks.forEach((task) => {
    map.set(task.id, []);
  });
  props.dependencies.forEach((dep) => {
    const predecessor = dep.predecessorTaskId;
    const successor = dep.successorTaskId;
    if (!map.has(predecessor)) {
      map.set(predecessor, []);
    }
    map.get(predecessor)?.push(successor);
  });
  return map;
});

const hasCycleInternal = () => {
  const visited = new Set<string>();
  const stack = new Set<string>();

  const dfs = (node: string): boolean => {
    if (stack.has(node)) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    stack.add(node);
    const nextNodes = adjacency.value.get(node) || [];
    for (const next of nextNodes) {
      if (dfs(next)) return true;
    }
    stack.delete(node);
    return false;
  };

  for (const task of props.tasks) {
    if (dfs(task.id)) return true;
  }
  return false;
};

const calculateCriticalPath = () => {
  const indegree = new Map<string, number>();
  const duration = new Map<string, number>();
  const predecessor = new Map<string, string | null>();

  props.tasks.forEach((task) => {
    indegree.set(task.id, 0);
    duration.set(task.id, task.estimatedMinutes || 0);
    predecessor.set(task.id, null);
  });

  props.dependencies.forEach((dep) => {
    indegree.set(dep.successorTaskId, (indegree.get(dep.successorTaskId) || 0) + 1);
  });

  const queue: string[] = [];
  indegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  const longest = new Map<string, number>();
  props.tasks.forEach((task) => longest.set(task.id, task.estimatedMinutes || 0));

  while (queue.length) {
    const current = queue.shift()!;
    const nextNodes = adjacency.value.get(current) || [];
    for (const next of nextNodes) {
      const candidate = (longest.get(current) || 0) + (duration.get(next) || 0);
      if (candidate > (longest.get(next) || 0)) {
        longest.set(next, candidate);
        predecessor.set(next, current);
      }
      indegree.set(next, (indegree.get(next) || 0) - 1);
      if ((indegree.get(next) || 0) === 0) {
        queue.push(next);
      }
    }
  }

  let endTask: string | null = null;
  let maxDuration = 0;
  longest.forEach((value, id) => {
    if (value > maxDuration) {
      maxDuration = value;
      endTask = id;
    }
  });

  const path: string[] = [];
  let current = endTask;
  while (current) {
    path.unshift(current);
    current = predecessor.get(current) || null;
  }

  return { path, duration: maxDuration };
};

// State
const chartContainer = ref<HTMLElement>();
const chartInstance = ref<ECharts>();
const loading = ref(false);
const error = ref<string | null>(null);
const layoutType = ref<'force' | 'circular'>('force');
const showCriticalPath = ref(false);

// Computed
const hasData = computed(() => props.tasks.length > 0);
const chartHeight = computed(() => props.height);

const graphStats = computed(() => {
  return {
    totalTasks: props.tasks.length,
    totalDependencies: props.dependencies.length,
    hasCycle: hasCycleInternal(),
  };
});

const criticalPathInfo = computed(() => {
  if (!showCriticalPath.value || props.tasks.length === 0) return null;
  return calculateCriticalPath();
});

const getTaskColor = (task: TaskClientDTO): string => {
  if (task.status === 'COMPLETED') return '#4CAF50';
  if (task.status === 'IN_PROGRESS') return '#2196F3';
  if (task.status === 'BLOCKED') return '#F44336';
  return '#9E9E9E';
};

// Methods
function initChart() {
  if (!chartContainer.value) return;
  chartInstance.value = echarts.init(chartContainer.value);
  updateChart();
}

function updateChart() {
  if (!chartInstance.value) return;

  try {
    const criticalPathSet = new Set(criticalPathInfo.value?.path || []);

    const nodes = props.tasks.map((task) => ({
      id: task.id,
      name: task.title,
      itemStyle: {
        color: showCriticalPath.value && criticalPathSet.has(task.id) ? '#E53935' : getTaskColor(task),
      },
      symbolSize: showCriticalPath.value && criticalPathSet.has(task.id) ? 48 : 38,
    }));

    const edges = props.dependencies.map((dep) => ({
      source: dep.predecessorTaskId,
      target: dep.successorTaskId,
      value: dep.dependencyType,
      lineStyle: {
        color:
          showCriticalPath.value &&
          criticalPathSet.has(dep.predecessorTaskId) &&
          criticalPathSet.has(dep.successorTaskId)
            ? '#E53935'
            : '#9E9E9E',
        width:
          showCriticalPath.value &&
          criticalPathSet.has(dep.predecessorTaskId) &&
          criticalPathSet.has(dep.successorTaskId)
            ? 3
            : 1.5,
      },
    }));

    const option: EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const task = props.tasks.find(t => t.id === params.data.id);
            if (!task) return '';
            return `<div style="padding: 8px;">
              <div style="font-weight: bold;">${task.title}</div>
              <div>预估: ${task.estimatedMinutes || 0} 分钟</div>
            </div>`;
          }
          return '';
        },
      },
      series: [{
        type: 'graph',
        layout: layoutType.value,
        data: nodes,
        links: edges as any,
        roam: true,
        label: { show: true, position: 'right' },
        lineStyle: { curveness: 0.3 },
        force: layoutType.value === 'force' ? { repulsion: 1000, edgeLength: [100, 300] } : undefined,
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 10],
      }],
    };

    chartInstance.value.setOption(option);
  } catch (err) {
    error.value = '渲染图表失败';
  }
}

function refreshGraph() {
  loading.value = true;
  error.value = null;
  nextTick(() => {
    try {
      updateChart();
    } finally {
      loading.value = false;
    }
  });
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}小时${mins}分钟` : `${mins}分钟`;
}

// Watchers
watch([() => props.tasks, () => props.dependencies], () => {
  if (chartInstance.value) updateChart();
});

watch(layoutType, updateChart);
watch(showCriticalPath, updateChart);

// Lifecycle
onMounted(async () => {
  await nextTick();
  initChart();
  window.addEventListener('resize', handleResize);
});

const handleResize = () => chartInstance.value?.resize();

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
  chartInstance.value?.dispose();
});
</script>

<style scoped>
.task-dependency-graph {
  height: 100%;
}
.gap-2 {
  gap: 8px;
}
</style>

