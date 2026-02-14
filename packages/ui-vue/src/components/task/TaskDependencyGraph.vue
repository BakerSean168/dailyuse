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
import { taskDependencyGraphService } from '@/modules/task/application/services/TaskDependencyGraphService';
import type { TaskTemplateClientDTO, TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import type { TaskForDAG } from '@/modules/task/types/task-dag.types';
import { taskTemplateToDAG } from '@/modules/task/types/task-dag.types';

type TaskClientDTO = TaskTemplateClientDTO;

// Props
interface Props {
  tasks: TaskClientDTO[];
  dependencies: TaskDependencyClientDTO[];
  height?: number;
}

const props = withDefaults(defineProps<Props>(), {
  height: 600,
});

// 将 TaskTemplateClientDTO 转换为 TaskForDAG
const tasksForDAG = computed<TaskForDAG[]>(() => props.tasks.map(taskTemplateToDAG));

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
  const sorted = taskDependencyGraphService.topologicalSort(tasksForDAG.value, props.dependencies);
  return {
    totalTasks: props.tasks.length,
    totalDependencies: props.dependencies.length,
    hasCycle: sorted.hasCycle,
  };
});

const criticalPathInfo = computed(() => {
  if (!showCriticalPath.value || props.tasks.length === 0) return null;
  try {
    return taskDependencyGraphService.calculateCriticalPath(tasksForDAG.value, props.dependencies);
  } catch {
    return null;
  }
});

// Methods
function initChart() {
  if (!chartContainer.value) return;
  chartInstance.value = echarts.init(chartContainer.value);
  updateChart();
}

function updateChart() {
  if (!chartInstance.value) return;

  try {
    let graphData = taskDependencyGraphService.transformToGraphData(tasksForDAG.value, props.dependencies);

    if (showCriticalPath.value && criticalPathInfo.value) {
      graphData = taskDependencyGraphService.highlightCriticalPath(graphData, criticalPathInfo.value);
    }

    const option: EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.dataType === 'node') {
            const task = props.tasks.find(t => t.uuid === params.data.id);
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
        data: graphData.nodes,
        links: graphData.edges as any, // ECharts 类型限制，实际 value 可为 string
        categories: graphData.categories,
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
  window.addEventListener('resize', () => chartInstance.value?.resize());
});

onUnmounted(() => {
  window.removeEventListener('resize', () => chartInstance.value?.resize());
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

