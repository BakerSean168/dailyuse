<template>
  <Card class="h-full">
    <!-- 工具栏 -->
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <div class="flex items-center">
        <Share2 class="mr-2 h-5 w-5 text-primary" />
        <CardTitle class="text-lg font-semibold">{{ t('task.dependencyGraph.title') }}</CardTitle>
      </div>
      <div class="flex items-center gap-2">
        <!-- 布局切换 -->
        <div class="flex border rounded-md">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                :variant="layoutType === 'force' ? 'default' : 'ghost'"
                size="sm"
                @click="layoutType = 'force'"
              >
                <ScatterChart class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('task.dependencyGraph.forceLayout') }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                :variant="layoutType === 'circular' ? 'default' : 'ghost'"
                size="sm"
                @click="layoutType = 'circular'"
              >
                <PieChart class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t('task.dependencyGraph.circularLayout') }}</TooltipContent>
          </Tooltip>
        </div>

        <!-- 关键路径切换 -->
        <div class="flex items-center gap-2">
          <Switch :checked="showCriticalPath" @update:checked="showCriticalPath = $event" />
          <Label class="text-sm">{{ t('task.dependencyGraph.criticalPath') }}</Label>
        </div>

        <!-- 刷新按钮 -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              @click="refreshGraph"
              :disabled="loading"
            >
              <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
              <RefreshCw v-else class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ t('task.dependencyGraph.refresh') }}</TooltipContent>
        </Tooltip>
      </div>
    </CardHeader>

    <!-- 图表容器 -->
    <CardContent>
      <div v-if="loading" class="flex justify-center items-center" style="height: 500px">
        <Loader2 class="h-16 w-16 animate-spin text-primary" />
      </div>

      <div v-else-if="error" class="text-center py-8">
        <AlertCircle class="h-16 w-16 text-destructive mx-auto" />
        <p class="text-lg font-semibold mt-4">{{ error }}</p>
        <Button class="mt-4" @click="refreshGraph">{{ t('task.dependencyGraph.retry') }}</Button>
      </div>

      <div v-else-if="!hasData" class="text-center py-8">
        <Share2 class="h-16 w-16 text-muted-foreground mx-auto" />
        <p class="text-lg font-semibold mt-4">{{ t('task.dependencyGraph.emptyTitle') }}</p>
        <p class="text-sm text-muted-foreground">
          {{ t('task.dependencyGraph.emptyDescription') }}
        </p>
      </div>

      <div v-else ref="chartContainer" :style="{ height: chartHeight + 'px' }" />
    </CardContent>

    <!-- 图例和统计 -->
    <CardContent v-if="hasData && !loading" class="pt-0">
      <Separator class="mb-4" />

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 统计信息 -->
        <div>
          <div class="text-sm font-medium mb-2">{{ t('task.dependencyGraph.stats') }}</div>
          <div class="flex flex-wrap gap-2">
            <Badge variant="secondary" class="text-xs">
              <CheckSquare class="h-3 w-3 mr-1" />
              {{ graphStats.totalTasks }} {{ t('task.dependencyGraph.taskCount') }}
            </Badge>
            <Badge variant="secondary" class="text-xs">
              <ArrowRight class="h-3 w-3 mr-1" />
              {{ graphStats.totalDependencies }} {{ t('task.dependencyGraph.depCount') }}
            </Badge>
            <Badge v-if="graphStats.hasCycle" variant="destructive" class="text-xs">
              <AlertTriangle class="h-3 w-3 mr-1" />
              {{ t('task.dependencyGraph.cyclicDetected') }}
            </Badge>
          </div>
        </div>

        <!-- 关键路径信息 -->
        <div v-if="showCriticalPath && criticalPathInfo">
          <div class="text-sm font-medium mb-2">
            {{ t('task.dependencyGraph.criticalPathLabel') }}
          </div>
          <div class="flex flex-wrap gap-2">
            <Badge variant="destructive" class="text-xs">
              <Timer class="h-3 w-3 mr-1" />
              {{ t('task.dependencyGraph.totalDuration')
              }}{{ formatDuration(criticalPathInfo.duration) }}
            </Badge>
            <Badge variant="destructive" class="text-xs">
              <Route class="h-3 w-3 mr-1" />
              {{ criticalPathInfo.path.length }} {{ t('task.dependencyGraph.criticalTaskCount') }}
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import * as echarts from 'echarts';
import type { ECharts, EChartsOption } from 'echarts';
import type { TaskTemplateClientDTO, TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import type { TaskForDAGViewModel } from './types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Separator,
  Switch,
  Label,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@dailyuse/ui-vue-shadcn';
import {
  Share2,
  ScatterChart,
  PieChart,
  RefreshCw,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckSquare,
  ArrowRight,
  Timer,
  Route,
} from 'lucide-vue-next';

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

const { t } = useI18n();

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
        color:
          showCriticalPath.value && criticalPathSet.has(task.id) ? '#E53935' : getTaskColor(task),
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
            const task = props.tasks.find((t) => t.id === params.data.id);
            if (!task) return '';
            return `<div style="padding: 8px;">
              <div style="font-weight: bold;">${task.title}</div>
              <div>${t('task.dependencyGraph.estimateTooltip', { duration: task.estimatedMinutes || 0 })}</div>
            </div>`;
          }
          return '';
        },
      },
      series: [
        {
          type: 'graph',
          layout: layoutType.value,
          data: nodes,
          links: edges as any,
          roam: true,
          label: { show: true, position: 'right' },
          lineStyle: { curveness: 0.3 },
          force:
            layoutType.value === 'force' ? { repulsion: 1000, edgeLength: [100, 300] } : undefined,
          edgeSymbol: ['none', 'arrow'],
          edgeSymbolSize: [0, 10],
        },
      ],
    };

    chartInstance.value.setOption(option);
  } catch (err) {
    error.value = t('task.dependencyGraph.renderFailed');
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
  return hours > 0
    ? `${hours}${t('task.dependencyGraph.hours')}${mins}${t('task.dependencyGraph.minutes')}`
    : `${mins}${t('task.dependencyGraph.minutes')}`;
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
