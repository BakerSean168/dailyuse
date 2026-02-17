<template>
  <div class="goal-dag-visualization">
    <v-card>
      <v-card-title v-if="!compact" class="d-flex align-center">
        <v-icon class="mr-2">mdi-graph-outline</v-icon>
        目标权重分布图

        <v-spacer />

        <!-- 权重总和显示 -->
        <v-chip color="info" size="small" class="mr-2">
          <v-icon start>mdi-dumbbell</v-icon>
          总权重: {{ totalWeight }}
        </v-chip>

        <!-- 布局类型切换 -->
        <v-btn-toggle v-model="layoutType" density="compact" mandatory divided>
          <v-btn value="force" size="small">
            <v-icon start>mdi-lightning-bolt</v-icon>
            力导向
          </v-btn>
          <v-btn value="hierarchical" size="small">
            <v-icon start>mdi-file-tree</v-icon>
            分层
          </v-btn>
        </v-btn-toggle>

        <!-- 重置布局按钮 -->
        <v-btn
          v-if="hasCustomLayout"
          icon="mdi-refresh"
          variant="text"
          size="small"
          class="ml-2"
          @click="resetLayout"
        >
          <v-icon>mdi-refresh</v-icon>
          <v-tooltip activator="parent" location="bottom"> 重置布局 </v-tooltip>
        </v-btn>

        <!-- 导出按钮 -->
        <v-btn
          icon="mdi-download"
          variant="text"
          size="small"
          class="ml-2"
          @click="exportDialog?.open()"
        >
          <v-icon>mdi-download</v-icon>
          <v-tooltip activator="parent" location="bottom"> 导出 (Ctrl+E) </v-tooltip>
        </v-btn>
      </v-card-title>

      <v-card-text>
        <!-- 权重分布信息 -->
        <v-alert v-if="!compact && hasKeyResults" type="info" variant="tonal" class="mb-4">
          <template #title>权重分布信息</template>
          总权重: {{ totalWeight }} | 权重范围: 1-10 | 占比计算: (权重/总权重) × 100%
        </v-alert>

        <!-- 加载状态 -->
        <v-alert v-if="isLoading && !loadError" type="info" variant="tonal" class="mb-4">
          <v-progress-linear indeterminate color="primary" class="mb-2" />
          正在加载目标数据...
        </v-alert>

        <!-- 错误状态 -->
        <v-alert v-else-if="loadError" type="error" variant="tonal" class="mb-4">
          <template #title>加载失败</template>
          {{ loadError }}
          <template #append>
            <v-btn 
              color="error" 
              variant="text" 
              size="small" 
              :loading="isRetrying"
              @click="retryLoad"
            >
              <v-icon start>mdi-refresh</v-icon>
              重试
            </v-btn>
          </template>
        </v-alert>

        <!-- 空状态 -->
        <v-alert v-else-if="!localGoal || !hasKeyResults" type="info" variant="tonal">
          {{ !localGoal ? '正在加载目标数据...' : '该 Goal 暂无 KeyResult' }}
        </v-alert>

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
        <div v-if="!compact && hasKeyResults" class="legend-section mt-4">
          <v-divider class="mb-3" />
          <div class="d-flex align-center flex-wrap gap-3">
            <v-chip size="small" color="primary" variant="flat">
              <v-icon start>mdi-circle</v-icon>
              Goal 节点
            </v-chip>
            <v-chip size="small" color="success" variant="flat">
              <v-icon start>mdi-circle</v-icon>
              权重 7-10
            </v-chip>
            <v-chip size="small" color="warning" variant="flat">
              <v-icon start>mdi-circle</v-icon>
              权重 4-7
            </v-chip>
            <v-chip size="small" color="error" variant="flat">
              <v-icon start>mdi-circle</v-icon>
              权重 1-3
            </v-chip>
            <v-spacer />
            <div class="text-caption text-grey">节点大小表示权重，边宽度表示权重占比</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

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
import { useGoal } from '../../composables/useGoal';
import { useResizeObserver } from '@vueuse/core';
import ExportDialog from './ExportDialog.vue';
import {
  dagExportService,
  type ExportOptions,
} from '../../../application/services/DAGExportService';

use([TitleComponent, TooltipComponent, LegendComponent, GraphChart, CanvasRenderer]);

const props = defineProps<{
  goalUuid: string;
  syncViewport?: boolean; // 是否启用视口同步
  compact?: boolean; // 紧凑模式（用于对比视图）
}>();

const emit = defineEmits<{
  (e: 'node-click', data: { id: string; type: 'goal' | 'kr' }): void;
  (e: 'viewport-change', viewport: { zoom: number; center: [number, number] }): void;
}>();

const { getGoalAggregateView } = useGoal();
const chartRef = ref();
const exportDialog = ref();
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
  const krs = localGoal.value.keyResults;

  const nodes = [];

  // Goal 节点居中
  nodes.push({
    id: localGoal.value.uuid,
    name: localGoal.value.title,
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
      id: kr.uuid,
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
    source: localGoal.value!.uuid,
    target: kr.uuid,
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

  const krs = localGoal.value.keyResults;

  const nodes = [
    {
      id: localGoal.value.uuid,
      name: localGoal.value.title,
      symbolSize: 80,
      itemStyle: { color: '#2196F3' },
      category: 0,
    },
    ...krs.map((kr: any) => ({
      id: kr.uuid,
      name: kr.title,
      value: kr.weight,
      symbolSize: 40 + kr.weight * 0.4,
      itemStyle: { color: getWeightColor(kr.weight) },
      category: 1,
    })),
  ];

  const links = krs.map((kr: any) => ({
    source: localGoal.value!.uuid,
    target: kr.uuid,
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
  const savedLayout = loadLayout(props.goalUuid);

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
            const percentage = totalWeight.value > 0 
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
const saveLayout = (goalUuid: string, positions: any[]) => {
  try {
    localStorage.setItem(`dag-layout-${goalUuid}`, JSON.stringify(positions));
    hasCustomLayout.value = true;
  } catch (error) {
    console.error('Failed to save layout:', error);
  }
};

// 从 localStorage 加载布局
const loadLayout = (goalUuid: string) => {
  try {
    const saved = localStorage.getItem(`dag-layout-${goalUuid}`);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load layout:', error);
    return null;
  }
};

// 重置布局
const resetLayout = () => {
  try {
    localStorage.removeItem(`dag-layout-${props.goalUuid}`);
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
            saveLayout(props.goalUuid, positions);
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
        blob = await dagExportService.exportPDF(chartInstance, options, {
          title: localGoal.value?.title || 'Goal DAG',
          author: 'DailyUse User',
          date: new Date().toLocaleString('zh-CN'),
        });
        break;
    }

    // 生成文件名并下载
    const filename = dagExportService.generateFilename(
      localGoal.value?.title || 'goal',
      options.format,
    );
    dagExportService.downloadBlob(blob, filename);

    // 关闭对话框
    exportDialog.value?.close();

    console.log(`Successfully exported ${options.format.toUpperCase()}: ${filename}`);
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
  if (!props.goalUuid) return;
  
  loadError.value = null;
  isLoading.value = true;
  try {
    const { goal } = await getGoalAggregateView(props.goalUuid);
    // 将 Goal 实体转换为可用的数据格式
    localGoal.value = goal.toClientDTO ? goal.toClientDTO(true) : goal;
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
  if (props.goalUuid) {
    await loadGoalData();
  }
});
</script>

<style scoped>
.goal-dag-visualization {
  width: 100%;
}

.dag-container {
  width: 100%;
  min-width: 600px;
  /* 使用 aspect-ratio 保持比例，同时设置合理的高度范围 */
  height: clamp(400px, 50vh, 600px);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
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

.legend-section {
  padding: 12px;
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
}

.gap-3 {
  gap: 12px;
}
</style>
