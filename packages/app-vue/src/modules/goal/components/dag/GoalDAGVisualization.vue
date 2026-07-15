<template>
  <div class="goal-dag-visualization w-full">
    <Card>
      <CardHeader v-if="!compact" class="flex flex-row items-center gap-2 pb-2">
        <GitBranch class="h-5 w-5 text-muted-foreground" />
        <CardTitle class="text-lg">{{ t('goal.dag.title') }}</CardTitle>

        <div class="flex-1" />

        <!-- 权重总和显示 -->
        <Badge variant="secondary" class="mr-2">
          <Dumbbell class="mr-1 h-3 w-3" />
          {{ t('goal.dag.totalWeight') }} {{ totalWeight }}
        </Badge>

        <!-- 布局类型切换 -->
        <div class="flex items-center rounded-md border">
          <Button
            :variant="layoutType === 'force' ? 'default' : 'ghost'"
            size="sm"
            @click="layoutType = 'force'"
          >
            <Zap class="mr-1 h-3.5 w-3.5" />
            {{ t('goal.dag.forceLayout') }}
          </Button>
          <Button
            :variant="layoutType === 'hierarchical' ? 'default' : 'ghost'"
            size="sm"
            @click="layoutType = 'hierarchical'"
          >
            <GitBranch class="mr-1 h-3.5 w-3.5" />
            {{ t('goal.dag.layeredLayout') }}
          </Button>
        </div>

        <!-- 重置布局按钮 -->
        <Tooltip v-if="hasCustomLayout">
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="ml-2 h-8 w-8"
              :aria-label="t('goal.dag.resetLayout')"
              @click="resetLayout"
            >
              <RefreshCw class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ t('goal.dag.resetLayout') }}</TooltipContent>
        </Tooltip>

        <!-- 导出按钮 -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon"
              class="ml-2 h-8 w-8"
              :aria-label="t('goal.dag.export')"
              @click="exportDialog?.open()"
            >
              <Download class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ t('goal.dag.export') }}</TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent>
        <!-- 权重分布信息 -->
        <Alert v-if="!compact && hasKeyResults" class="mb-4">
          <AlertTitle>{{ t('goal.dag.weightInfo') }}</AlertTitle>
          <AlertDescription>
            {{ t('goal.dag.weightInfoDesc') }}
          </AlertDescription>
        </Alert>

        <!-- 加载状态 -->
        <Alert v-if="isLoading && !loadError" class="mb-4">
          <Loader2 class="h-4 w-4 animate-spin" />
          <AlertDescription>{{ t('goal.dag.loading') }}</AlertDescription>
        </Alert>

        <!-- 错误状态 -->
        <Alert v-else-if="loadError" variant="destructive" class="mb-4">
          <AlertTitle>{{ t('goal.dag.loadFailed') }}</AlertTitle>
          <AlertDescription class="flex items-center justify-between">
            <span>{{ loadError }}</span>
            <Button variant="ghost" size="sm" :disabled="isRetrying" @click="retryLoad">
              <RefreshCw class="mr-1 h-3.5 w-3.5" :class="{ 'animate-spin': isRetrying }" />
              {{ t('goal.dag.retry') }}
            </Button>
          </AlertDescription>
        </Alert>

        <!-- 空状态 -->
        <Alert v-else-if="!aggregateGoal || !hasKeyResults">
          <AlertDescription>
            {{ !aggregateGoal ? t('goal.dag.loading') : t('goal.dag.noKeyResult') }}
          </AlertDescription>
        </Alert>

        <!-- DAG 图表 -->
        <div v-else ref="containerRef" class="dag-container" :class="{ compact: compact }">
          <div ref="chartRef" class="chart" />
        </div>

        <!-- 图例说明 -->
        <div v-if="!compact && hasKeyResults" class="mt-4 rounded-lg bg-muted/50 p-3">
          <Separator class="mb-3" />
          <div class="flex flex-wrap items-center gap-3">
            <Badge variant="default">
              <Circle class="mr-1 h-2.5 w-2.5 fill-current" />
              {{ t('goal.dag.legendGoalNode') }}
            </Badge>
            <Badge class="bg-success text-white hover:bg-success">
              <Circle class="mr-1 h-2.5 w-2.5 fill-current" />
              {{ t('goal.dag.legendWeight7to10') }}
            </Badge>
            <Badge class="bg-amber-500 text-white hover:bg-amber-600">
              <Circle class="mr-1 h-2.5 w-2.5 fill-current" />
              {{ t('goal.dag.legendWeight4to7') }}
            </Badge>
            <Badge variant="destructive">
              <Circle class="mr-1 h-2.5 w-2.5 fill-current" />
              {{ t('goal.dag.legendWeight1to3') }}
            </Badge>
            <div class="flex-1" />
            <span class="text-xs text-muted-foreground">{{ t('goal.dag.legendHint') }}</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Export Dialog -->
    <ExportDialog ref="exportDialog" @export="handleExport" />
  </div>
</template>

<script setup lang="ts">
import { ref, shallowRef, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { use, init, type ECharts, type EChartsCoreOption, type ECElementEvent } from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { DefaultLabelFormatterCallbackParams } from 'echarts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Alert,
  AlertTitle,
  AlertDescription,
  Separator,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@dailyuse/ui-vue-shadcn';
import { GitBranch, Dumbbell, Zap, RefreshCw, Download, Loader2, Circle } from '@lucide/vue';
import type {
  GetGoalAggregateRes,
  GoalClientDTO,
  KeyResultClientDTO,
} from '@dailyuse/contracts/goal';
import { useGoal } from '../../composables/useGoal';
import { useResizeObserver } from '@vueuse/core';
import ExportDialog from './ExportDialog.vue';
import { dagExportService, type ExportOptions } from '../../utils/dag-export';
import { translateResultError } from '../../../../shared/utils/translate-result-error';

use([TitleComponent, TooltipComponent, LegendComponent, GraphChart, CanvasRenderer]);

/** Position data stored in localStorage for custom node layouts */
interface LayoutPosition {
  id: string;
  x: number;
  y: number;
}

/** Shape of graph node data as used in ECharts graph series */
interface DAGNodeData {
  id: string;
  name: string;
  value?: number;
  x?: number;
  y?: number;
  symbolSize: number;
  itemStyle: { color: string };
  category: number;
  fixed?: boolean;
}

interface ExportDialogHandle {
  open(): void;
  close(): void;
}

const props = defineProps<{
  goalId: string;
  syncViewport?: boolean; // 是否启用视口同步
  compact?: boolean; // 紧凑模式（用于对比视图）
}>();

const emit = defineEmits<{
  (e: 'node-click', data: { id: string; type: 'goal' | 'kr' }): void;
  (e: 'viewport-change', viewport: { zoom: number; center: [number, number] }): void;
}>();

const { getGoalAggregateView } = useGoal();
const { t } = useI18n();
const chartRef = ref<HTMLElement | null>(null);
const chartInstance = shallowRef<ECharts | null>(null);
const exportDialog = ref<ExportDialogHandle | null>(null);
const containerRef = ref<HTMLElement | null>(null);
const layoutType = ref<'force' | 'hierarchical'>('force');
const hasCustomLayout = ref(false);

const aggregateView = ref<GetGoalAggregateRes | null>(null);
const isLoading = ref(false);

// 加载错误状态
type LoadErrorState =
  | { kind: 'translation'; key: string }
  | { kind: 'result'; cause: unknown; fallbackKey: string };
const loadErrorState = shallowRef<LoadErrorState | null>(null);
const loadError = computed(() => {
  const state = loadErrorState.value;
  if (!state) return null;
  return state.kind === 'translation'
    ? t(state.key)
    : getGoalDagErrorMessage(state.cause, state.fallbackKey);
});
const isRetrying = ref(false);

// 视口同步相关状态
const currentZoom = ref(1);
const currentCenter = ref<[number, number]>([0, 0]);
const isUpdatingViewport = ref(false); // 防止循环更新

function rerenderChart() {
  chartInstance.value?.setOption(dagOption.value, true);
}

function getChartInstance(): ECharts | null {
  return chartInstance.value;
}

function syncLayoutAndViewport(instance: ECharts) {
  const option = instance.getOption();
  const series = Array.isArray(option.series) ? option.series[0] : option.series;
  const nodeData = series?.data as DAGNodeData[] | undefined;

  if (nodeData) {
    const positions: LayoutPosition[] = nodeData.map((node) => ({
      id: node.id,
      x: node.x ?? 0,
      y: node.y ?? 0,
    }));
    saveLayout(props.goalId, positions);
  }

  if (props.syncViewport && !isUpdatingViewport.value && series) {
    const seriesData = series as Record<string, unknown>;
    const zoom = (seriesData.zoom as number) || 1;
    const center = (seriesData.center as [number, number]) || ([0, 0] as [number, number]);

    currentZoom.value = zoom;
    currentCenter.value = center;

    emit('viewport-change', {
      zoom,
      center,
    });
  }
}

function handleGraphRoam(...args: unknown[]) {
  const event = args[0] as { type?: string } | undefined;
  if (event?.type !== 'graphRoam') return;

  const instance = getChartInstance();
  if (!instance) return;

  // 延迟保存以避免频繁写入
  setTimeout(() => {
    syncLayoutAndViewport(instance);
  }, 500);
}

async function ensureChartInitialized() {
  await nextTick();

  if (!chartRef.value || chartInstance.value) return;

  const instance = init(chartRef.value);
  chartInstance.value = instance;
  instance.on('click', handleNodeClick);
  instance.on('graphRoam', handleGraphRoam);
  rerenderChart();
}

function disposeChart() {
  const instance = chartInstance.value;
  if (!instance) return;
  instance.off('click', handleNodeClick);
  instance.off('graphRoam', handleGraphRoam);
  instance.dispose();
  chartInstance.value = null;
}

function getGoalDagErrorMessage(error: unknown, fallbackKey: string) {
  return translateResultError(error, t, { fallbackKey });
}

// 计算属性
const aggregateGoal = computed<GoalClientDTO | null>(() => aggregateView.value?.goal ?? null);
const aggregateKeyResults = computed<KeyResultClientDTO[]>(
  () => aggregateView.value?.keyResults ?? [],
);

const hasKeyResults = computed(() => aggregateKeyResults.value.length > 0);

const totalWeight = computed(() => {
  return aggregateKeyResults.value.reduce((sum, kr) => sum + kr.weight, 0);
});

// 颜色映射函数 (权重范围: 1-10)
const getWeightColor = (weight: number): string => {
  if (weight >= 7) return '#4CAF50'; // 绿色 - 高权重 (7-10)
  if (weight >= 4) return '#FF9800'; // 橙色 - 中权重 (4-7)
  return '#F44336'; // 红色 - 低权重 (1-3)
};

// 分层布局计算
const calculateHierarchicalLayout = () => {
  if (!aggregateGoal.value) return { nodes: [], links: [] };

  const containerWidth = 800;
  const goalY = 100;
  const krY = 300;
  const krs = aggregateKeyResults.value;

  const nodes = [];

  // Goal 节点居中
  nodes.push({
    id: aggregateGoal.value.id,
    name: aggregateGoal.value.name,
    x: containerWidth / 2,
    y: goalY,
    symbolSize: 80,
    itemStyle: { color: '#2196F3' },
    category: 0,
    fixed: true,
  });

  // KR 节点均匀分布
  const krSpacing = krs.length > 1 ? containerWidth / (krs.length + 1) : containerWidth / 2;
  krs.forEach((kr: KeyResultClientDTO, index: number) => {
    nodes.push({
      id: kr.id,
      name: kr.title,
      value: kr.weight,
      x: krSpacing * (index + 1),
      y: krY,
      symbolSize: 40 + kr.weight * 0.4,
      itemStyle: { color: getWeightColor(kr.weight) },
      category: 1,
      fixed: true,
    });
  });

  const links = krs.map((kr) => ({
    source: aggregateGoal.value!.id,
    target: kr.id,
    lineStyle: {
      width: Math.max(1, kr.weight / 2),
      color: '#999',
    },
  }));

  return { nodes, links };
};

// Force 布局配置
const calculateForceLayout = () => {
  if (!aggregateGoal.value) return { nodes: [], links: [] };

  const krs = aggregateKeyResults.value;

  const nodes = [
    {
      id: aggregateGoal.value.id,
      name: aggregateGoal.value.name,
      symbolSize: 80,
      itemStyle: { color: '#2196F3' },
      category: 0,
    },
    ...krs.map((kr) => ({
      id: kr.id,
      name: kr.title,
      value: kr.weight,
      symbolSize: 40 + kr.weight * 0.4,
      itemStyle: { color: getWeightColor(kr.weight) },
      category: 1,
    })),
  ];

  const links = krs.map((kr) => ({
    source: aggregateGoal.value!.id,
    target: kr.id,
    lineStyle: {
      width: Math.max(1, kr.weight / 2),
      color: '#999',
    },
  }));

  return { nodes, links };
};

// DAG 图表配置
const dagOption = computed<EChartsCoreOption>(() => {
  if (!aggregateGoal.value || !hasKeyResults.value) return {};

  // 从 localStorage 加载保存的布局
  const savedLayout = loadLayout(props.goalId);

  let graphData;
  if (layoutType.value === 'hierarchical') {
    graphData = calculateHierarchicalLayout();
  } else {
    graphData = calculateForceLayout();
  }

  // 应用保存的坐标
  if (savedLayout && layoutType.value === 'force') {
    graphData.nodes.forEach((node: DAGNodeData) => {
      const saved = savedLayout.find((s: LayoutPosition) => s.id === node.id);
      if (saved) {
        node.x = saved.x;
        node.y = saved.y;
        node.fixed = true;
      }
    });
    hasCustomLayout.value = true;
  } else {
    hasCustomLayout.value = false;
  }

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: DefaultLabelFormatterCallbackParams) => {
        const data = params.data as DAGNodeData;
        if (params.dataType === 'node') {
          const isGoal = data.category === 0;
          if (isGoal) {
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">
                  <span style="color: #2196F3;">●</span> Goal
                </div>
                <div>${data.name}</div>
              </div>
            `;
          } else {
            // 计算权重占比
            const percentage =
              totalWeight.value > 0
                ? (((data.value ?? 0) / totalWeight.value) * 100).toFixed(1)
                : 0;
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">
                  <span style="color: ${data.itemStyle.color};">●</span> KeyResult
                </div>
                <div>${data.name}</div>
                <div style="margin-top: 4px;">
                  <span style="color: #666;">${t('goal.dag.tooltipWeight')}</span>
                  <span style="font-weight: bold; color: ${data.itemStyle.color};">${data.value ?? 0}/10</span>
                  <span style="color: #999; margin-left: 4px;">(${percentage}%)</span>
                </div>
              </div>
            `;
          }
        } else if (params.dataType === 'edge') {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold;">${t('goal.dag.tooltipWeightAllocation')}</div>
              <div style="margin-top: 4px; color: #666;">
                ${t('goal.dag.tooltipEdgeHint')}
              </div>
            </div>
          `;
        }
        return '';
      },
    },
    legend: {
      data: ['Goal', 'KeyResult'],
      bottom: 10,
    },
    animationDuration: 1000,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: layoutType.value === 'force' ? 'force' : 'none',
        data: graphData.nodes,
        links: graphData.links,
        categories: [{ name: 'Goal', itemStyle: { color: '#2196F3' } }, { name: 'KeyResult' }],
        roam: true,
        draggable: true,
        label: {
          show: true,
          position: 'right',
          fontSize: 12,
          formatter: '{b}',
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 5,
          },
        },
        force: {
          repulsion: 300,
          edgeLength: [150, 250],
          layoutAnimation: true,
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 10],
      },
    ],
  };
});

// 保存布局到 localStorage
const saveLayout = (goalId: string, positions: LayoutPosition[]) => {
  try {
    localStorage.setItem(`dag-layout-${goalId}`, JSON.stringify(positions));
    hasCustomLayout.value = true;
  } catch (error) {
    console.error('Failed to save layout:', error);
  }
};

// 从 localStorage 加载布局
const loadLayout = (goalId: string): LayoutPosition[] | null => {
  try {
    const saved = localStorage.getItem(`dag-layout-${goalId}`);
    return saved ? (JSON.parse(saved) as LayoutPosition[]) : null;
  } catch (error) {
    console.error('Failed to load layout:', error);
    return null;
  }
};

// 重置布局
const resetLayout = () => {
  try {
    localStorage.removeItem(`dag-layout-${props.goalId}`);
    hasCustomLayout.value = false;
    // 强制重新渲染图表
    nextTick(() => {
      rerenderChart();
    });
  } catch (error) {
    console.error('Failed to reset layout:', error);
  }
};

// 处理节点点击
const handleNodeClick = (params: ECElementEvent) => {
  if (params.dataType === 'node') {
    const data = params.data as DAGNodeData;
    emit('node-click', {
      id: data.id,
      type: data.category === 0 ? 'goal' : 'kr',
    });
  }
};

// 监听布局类型变化，保存到 localStorage
watch(layoutType, (newType) => {
  try {
    localStorage.setItem('dag-layout-type', newType);
  } catch (error) {
    console.error('Failed to save layout type:', error);
  }
});

// 响应式容器尺寸监听
useResizeObserver(containerRef, (entries) => {
  const entry = entries[0];
  const { width, height } = entry.contentRect;

  if (width > 0 && height > 0) {
    chartInstance.value?.resize();

    // 如果是分层布局，重新计算节点位置
    if (layoutType.value === 'hierarchical') {
      nextTick(() => {
        rerenderChart();
      });
    }
  }
});

// 导出处理
const handleExport = async (options: ExportOptions) => {
  try {
    const instance = getChartInstance();
    if (!instance) {
      console.error('Chart instance not found');
      return;
    }

    let blob: Blob;

    // 根据格式选择导出方法
    switch (options.format) {
      case 'png':
        blob = await dagExportService.exportPNG(instance, options);
        break;
      case 'svg':
        blob = await dagExportService.exportSVG(instance, options);
        break;
      case 'pdf':
        blob = await dagExportService.exportPDF(instance, {
          ...options,
          scale: options.resolution ?? options.scale,
        });
        break;
    }

    // 生成文件名并下载
    const filename = dagExportService.generateFilename(
      aggregateGoal.value?.name || 'goal',
      options.format,
    );
    dagExportService.downloadBlob(blob, filename);

    // 关闭对话框
    exportDialog.value?.close();
  } catch (error) {
    console.error('Export failed:', error);
    alert(t('goal.dag.exportFailed'));
  }
};

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    exportDialog.value?.open();
  }
};

// 视口同步方法：从外部更新视口
const updateViewport = (viewport: { zoom: number; center: [number, number] }) => {
  if (!props.syncViewport) return;

  isUpdatingViewport.value = true;

  try {
    const instance = getChartInstance();
    if (!instance) return;
    const currentOption = instance.getOption();
    const currentSeries = Array.isArray(currentOption.series)
      ? currentOption.series[0]
      : currentOption.series;

    // 更新图表配置
    instance.setOption(
      {
        series: [
          {
            ...(currentSeries ?? {}),
            zoom: viewport.zoom,
            center: viewport.center,
          },
        ],
      },
      { notMerge: false, lazyUpdate: false },
    );

    currentZoom.value = viewport.zoom;
    currentCenter.value = viewport.center;
  } catch (error) {
    console.error('Failed to update viewport:', error);
  } finally {
    // 延迟重置标志，避免立即触发事件
    setTimeout(() => {
      isUpdatingViewport.value = false;
    }, 100);
  }
};

// 加载目标数据
const loadGoalData = async () => {
  if (!props.goalId) return;

  loadErrorState.value = null;
  isLoading.value = true;
  aggregateView.value = null;
  try {
    const result = await getGoalAggregateView(props.goalId);
    if (!result) {
      loadErrorState.value = { kind: 'translation', key: 'goal.dag.loadDataFailed' };
      return;
    }

    aggregateView.value = result;
  } catch (error) {
    console.error('Failed to load goal aggregate view:', error);
    loadErrorState.value = {
      kind: 'result',
      cause: error,
      fallbackKey: 'goal.dag.loadDataFailed',
    };
  } finally {
    isLoading.value = false;
  }
};

// 重试加载
const retryLoad = async () => {
  isRetrying.value = true;
  try {
    await loadGoalData();
  } finally {
    isRetrying.value = false;
  }
};

// 暴露方法给父组件
defineExpose({
  updateViewport,
  retryLoad,
});

watch(
  () => (!isLoading.value && !loadError.value && !!aggregateGoal.value && hasKeyResults.value),
  async (isReady) => {
    if (!isReady) {
      disposeChart();
      return;
    }

    await ensureChartInitialized();
  },
  { immediate: true },
);

watch(dagOption, () => {
  rerenderChart();
});

// 初始化
onMounted(async () => {
  window.addEventListener('keydown', handleKeydown);

  // 加载布局类型偏好
  try {
    const savedType = localStorage.getItem('dag-layout-type');
    if (savedType === 'force' || savedType === 'hierarchical') {
      layoutType.value = savedType;
    }
  } catch (error) {
    console.error('Failed to load layout type:', error);
  }

  // 加载 Goal 数据
  if (props.goalId) {
    await loadGoalData();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
  disposeChart();
});
</script>

<style scoped>
.dag-container {
  width: 100%;
  min-width: 600px;
  height: clamp(400px, 50vh, 600px);
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  background-color: hsl(var(--muted) / 0.3);
  position: relative;
}

.dag-container.compact {
  min-width: 300px;
  height: clamp(250px, 40vh, 400px);
}

.chart {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
