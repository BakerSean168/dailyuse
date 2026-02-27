<template>
  <div class="goal-dag-visualization w-full">
    <Card>
      <CardHeader v-if="!compact" class="flex flex-row items-center gap-2 pb-2">
        <GitBranch class="h-5 w-5 text-muted-foreground" />
        <CardTitle class="text-lg">目标权重分布图</CardTitle>

        <div class="flex-1" />

        <!-- 权重总和显示 -->
        <Badge variant="secondary" class="mr-2">
          <Dumbbell class="mr-1 h-3 w-3" />
          总权重: {{ totalWeight }}
        </Badge>

        <!-- 布局类型切换 -->
        <div class="flex items-center rounded-md border">
          <Button
            :variant="layoutType === 'force' ? 'default' : 'ghost'"
            size="sm"
            @click="layoutType = 'force'"
          >
            <Zap class="mr-1 h-3.5 w-3.5" />
            力导向
          </Button>
          <Button
            :variant="layoutType === 'hierarchical' ? 'default' : 'ghost'"
            size="sm"
            @click="layoutType = 'hierarchical'"
          >
            <GitBranch class="mr-1 h-3.5 w-3.5" />
            分层
          </Button>
        </div>

        <!-- 重置布局按钮 -->
        <Tooltip v-if="hasCustomLayout">
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" class="ml-2 h-8 w-8" @click="resetLayout">
              <RefreshCw class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>重置布局</TooltipContent>
        </Tooltip>

        <!-- 导出按钮 -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button variant="ghost" size="icon" class="ml-2 h-8 w-8" @click="exportDialog?.open()">
              <Download class="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>导出 (Ctrl+E)</TooltipContent>
        </Tooltip>
      </CardHeader>

      <CardContent>
        <!-- 权重分布信息 -->
        <Alert v-if="!compact && hasKeyResults" class="mb-4">
          <AlertTitle>权重分布信息</AlertTitle>
          <AlertDescription>
            总权重: {{ totalWeight }} | 权重范围: 1-10 | 占比计算: (权重/总权重) × 100%
          </AlertDescription>
        </Alert>

        <!-- 加载状态 -->
        <Alert v-if="isLoading && !loadError" class="mb-4">
          <Loader2 class="h-4 w-4 animate-spin" />
          <AlertDescription>正在加载目标数据...</AlertDescription>
        </Alert>

        <!-- 错误状态 -->
        <Alert v-else-if="loadError" variant="destructive" class="mb-4">
          <AlertTitle>加载失败</AlertTitle>
          <AlertDescription class="flex items-center justify-between">
            <span>{{ loadError }}</span>
            <Button variant="ghost" size="sm" :disabled="isRetrying" @click="retryLoad">
              <RefreshCw class="mr-1 h-3.5 w-3.5" :class="{ 'animate-spin': isRetrying }" />
              重试
            </Button>
          </AlertDescription>
        </Alert>

        <!-- 空状态 -->
        <Alert v-else-if="!localGoal || !hasKeyResults">
          <AlertDescription>
            {{ !localGoal ? '正在加载目标数据...' : '该 Goal 暂无 KeyResult' }}
          </AlertDescription>
        </Alert>

        <!-- DAG 图表 -->
        <div v-else ref="containerRef" class="dag-container" :class="{ compact: compact }">
          <v-chart
            ref="chartRef"
            class="chart"
            :option="dagOption"
            autoresize
            @click="handleNodeClick"
          />
        </div>

        <!-- 图例说明 -->
        <div v-if="!compact && hasKeyResults" class="mt-4 rounded-lg bg-muted/50 p-3">
          <Separator class="mb-3" />
          <div class="flex flex-wrap items-center gap-3">
            <Badge variant="default">
              <Circle class="mr-1 h-2.5 w-2.5 fill-current" />
              Goal 节点
            </Badge>
            <Badge class="bg-green-600 text-white hover:bg-green-700">
              <Circle class="mr-1 h-2.5 w-2.5 fill-current" />
              权重 7-10
            </Badge>
            <Badge class="bg-amber-500 text-white hover:bg-amber-600">
              <Circle class="mr-1 h-2.5 w-2.5 fill-current" />
              权重 4-7
            </Badge>
            <Badge variant="destructive">
              <Circle class="mr-1 h-2.5 w-2.5 fill-current" />
              权重 1-3
            </Badge>
            <div class="flex-1" />
            <span class="text-xs text-muted-foreground">节点大小表示权重，边宽度表示权重占比</span>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Export Dialog -->
    <ExportDialog ref="exportDialog" @export="handleExport" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { use } from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import VChart from 'vue-echarts';
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
import { GitBranch, Dumbbell, Zap, RefreshCw, Download, Loader2, Circle } from 'lucide-vue-next';
import { useGoal } from '../../composables/useGoal';
import { useResizeObserver } from '@vueuse/core';
import ExportDialog from './ExportDialog.vue';
import { dagExportService, type ExportOptions } from '../../application/services/DAGExportService';

use([TitleComponent, TooltipComponent, LegendComponent, GraphChart, CanvasRenderer]);

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
const chartRef = ref<any>(null);
const exportDialog = ref<any>(null);
const containerRef = ref<HTMLElement>();
const layoutType = ref<'force' | 'hierarchical'>('force');
const hasCustomLayout = ref(false);
const containerSize = ref({ width: 800, height: 600 });

// 本地 goal 数据（不依赖 store 的 currentGoal）
const localGoal = ref<any>(null);
const isLoading = ref(false);

// 加载错误状态
const loadError = ref<string | null>(null);
const isRetrying = ref(false);

// 视口同步相关状态
const currentZoom = ref(1);
const currentCenter = ref<[number, number]>([0, 0]);
const isUpdatingViewport = ref(false); // 防止循环更新

// 计算属性
const hasKeyResults = computed(() => {
  return localGoal.value?.keyResults && localGoal.value.keyResults.length > 0;
});

const totalWeight = computed(() => {
  if (!localGoal.value?.keyResults) return 0;
  return localGoal.value.keyResults.reduce((sum: number, kr: any) => sum + kr.weight, 0);
});

// 颜色映射函数 (权重范围: 1-10)
const getWeightColor = (weight: number): string => {
  if (weight >= 7) return '#4CAF50'; // 绿色 - 高权重 (7-10)
  if (weight >= 4) return '#FF9800'; // 橙色 - 中权重 (4-7)
  return '#F44336'; // 红色 - 低权重 (1-3)
};

// 分层布局计算
const calculateHierarchicalLayout = () => {
  if (!localGoal.value) return { nodes: [], links: [] };

  const containerWidth = 800;
  const goalY = 100;
  const krY = 300;
  const krs = localGoal.value.keyResults ?? [];

  const nodes = [];

  // Goal 节点居中
  nodes.push({
    id: localGoal.value.id,
    name: localGoal.value.name,
    x: containerWidth / 2,
    y: goalY,
    symbolSize: 80,
    itemStyle: { color: '#2196F3' },
    category: 0,
    fixed: true,
  });

  // KR 节点均匀分布
  const krSpacing = krs.length > 1 ? containerWidth / (krs.length + 1) : containerWidth / 2;
  krs.forEach((kr: any, index: number) => {
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

  const links = krs.map((kr: any) => ({
    source: localGoal.value!.id,
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
  if (!localGoal.value) return { nodes: [], links: [] };

  const krs = localGoal.value.keyResults ?? [];

  const nodes = [
    {
      id: localGoal.value.id,
      name: localGoal.value.name,
      symbolSize: 80,
      itemStyle: { color: '#2196F3' },
      category: 0,
    },
    ...krs.map((kr: any) => ({
      id: kr.id,
      name: kr.title,
      value: kr.weight,
      symbolSize: 40 + kr.weight * 0.4,
      itemStyle: { color: getWeightColor(kr.weight) },
      category: 1,
    })),
  ];

  const links = krs.map((kr: any) => ({
    source: localGoal.value!.id,
    target: kr.id,
    lineStyle: {
      width: Math.max(1, kr.weight / 2),
      color: '#999',
    },
  }));

  return { nodes, links };
};

// DAG 图表配置
const dagOption = computed<EChartsOption>(() => {
  if (!localGoal.value || !hasKeyResults.value) return {};

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
    graphData.nodes.forEach((node: any) => {
      const saved = savedLayout.find((s: any) => s.id === node.id);
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
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const isGoal = params.data.category === 0;
          if (isGoal) {
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">
                  <span style="color: #2196F3;">●</span> Goal
                </div>
                <div>${params.data.name}</div>
              </div>
            `;
          } else {
            // 计算权重占比
            const percentage =
              totalWeight.value > 0
                ? ((params.data.value / totalWeight.value) * 100).toFixed(1)
                : 0;
            return `
              <div style="padding: 8px;">
                <div style="font-weight: bold; margin-bottom: 4px;">
                  <span style="color: ${params.data.itemStyle.color};">●</span> KeyResult
                </div>
                <div>${params.data.name}</div>
                <div style="margin-top: 4px;">
                  <span style="color: #666;">权重:</span> 
                  <span style="font-weight: bold; color: ${params.data.itemStyle.color};">${params.data.value}/10</span>
                  <span style="color: #999; margin-left: 4px;">(${percentage}%)</span>
                </div>
              </div>
            `;
          }
        } else if (params.dataType === 'edge') {
          return `
            <div style="padding: 8px;">
              <div style="font-weight: bold;">权重分配</div>
              <div style="margin-top: 4px; color: #666;">
                边宽度表示权重占比
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
const saveLayout = (goalId: string, positions: any[]) => {
  try {
    localStorage.setItem(`dag-layout-${goalId}`, JSON.stringify(positions));
    hasCustomLayout.value = true;
  } catch (error) {
    console.error('Failed to save layout:', error);
  }
};

// 从 localStorage 加载布局
const loadLayout = (goalId: string) => {
  try {
    const saved = localStorage.getItem(`dag-layout-${goalId}`);
    return saved ? JSON.parse(saved) : null;
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
      if (chartRef.value) {
        chartRef.value.setOption(dagOption.value, true);
      }
    });
  } catch (error) {
    console.error('Failed to reset layout:', error);
  }
};

// 处理节点点击
const handleNodeClick = (params: any) => {
  if (params.dataType === 'node') {
    const isGoal = params.data.category === 0;
    emit('node-click', {
      id: params.data.id,
      type: isGoal ? 'goal' : 'kr',
    });
  }
};

// 监听拖拽事件保存坐标
watch(chartRef, (chart) => {
  if (chart && layoutType.value === 'force') {
    const instance = chart.chart;
    instance.on('graphRoam', (params: any) => {
      if (params.type === 'graphRoam') {
        // 延迟保存以避免频繁写入
        setTimeout(() => {
          const option = instance.getOption();
          const series = option.series?.[0];
          if (series?.data) {
            const positions = series.data.map((node: any) => ({
              id: node.id,
              x: node.x,
              y: node.y,
            }));
            saveLayout(props.goalId, positions);
          }
        }, 500);

        // 视口同步：发送缩放和平移事件
        if (props.syncViewport && !isUpdatingViewport.value) {
          const option = instance.getOption();
          const series = option.series?.[0];
          if (series) {
            const zoom = series.zoom || 1;
            const center = series.center || [0, 0];

            currentZoom.value = zoom;
            currentCenter.value = center as [number, number];

            emit('viewport-change', {
              zoom,
              center: center as [number, number],
            });
          }
        }
      }
    });
  }
});

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
    containerSize.value = { width, height };

    // 如果是分层布局，重新计算节点位置
    if (layoutType.value === 'hierarchical') {
      nextTick(() => {
        if (chartRef.value) {
          chartRef.value.setOption(dagOption.value, true);
        }
      });
    }
  }
});

// 导出处理
const handleExport = async (options: ExportOptions) => {
  try {
    const chartInstance = chartRef.value?.chart;
    if (!chartInstance) {
      console.error('Chart instance not found');
      return;
    }

    let blob: Blob;

    // 根据格式选择导出方法
    switch (options.format) {
      case 'png':
        blob = await dagExportService.exportPNG(chartInstance, options);
        break;
      case 'svg':
        blob = await dagExportService.exportSVG(chartInstance, options);
        break;
      case 'pdf':
        blob = await dagExportService.exportPDF(chartInstance, {
          ...options,
          scale: options.resolution ?? options.scale,
        });
        break;
    }

    // 生成文件名并下载
    const filename = dagExportService.generateFilename(
      localGoal.value?.name || 'goal',
      options.format,
    );
    dagExportService.downloadBlob(blob, filename);

    // 关闭对话框
    exportDialog.value?.close();
  } catch (error) {
    console.error('Export failed:', error);
    alert('导出失败，请重试');
  }
};

// 键盘快捷键
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
      e.preventDefault();
      exportDialog.value?.open();
    }
  };

  window.addEventListener('keydown', handleKeydown);

  return () => {
    window.removeEventListener('keydown', handleKeydown);
  };
});

// 视口同步方法：从外部更新视口
const updateViewport = (viewport: { zoom: number; center: [number, number] }) => {
  if (!chartRef.value || !props.syncViewport) return;

  isUpdatingViewport.value = true;

  try {
    const instance = chartRef.value.chart;
    const currentOption = instance.getOption();

    // 更新图表配置
    instance.setOption(
      {
        series: [
          {
            ...currentOption.series[0],
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

  loadError.value = null;
  isLoading.value = true;
  try {
    const result = await getGoalAggregateView(props.goalId);
    // 将 Goal 实体转换为可用的数据格式
    const data = result as any;
    localGoal.value = data?.goal
      ? data.goal.toClientDTO
        ? data.goal.toClientDTO(true)
        : data.goal
      : data;
  } catch (error) {
    console.error('Failed to load goal aggregate view:', error);
    loadError.value = error instanceof Error ? error.message : '加载目标数据失败，请重试';
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
  chartRef,
  exportDialog,
  retryLoad,
});

// 初始化
onMounted(async () => {
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
