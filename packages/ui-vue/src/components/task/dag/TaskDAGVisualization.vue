<template>
  <div class="task-dag-visualization" data-testid="task-dag-visualization">
    <v-card elevation="2">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-icon color="primary">mdi-graph-outline</v-icon>
          <span class="text-h6">任务依赖关系图</span>
          <v-chip
            v-if="hasCriticalPath"
            color="error"
            size="small"
            variant="flat"
            data-testid="critical-path-chip"
          >
            关键路径: {{ criticalPathDuration }}分钟
          </v-chip>
        </div>

        <div class="d-flex align-center gap-2">
          <!-- 布局切换 -->
          <v-btn-toggle
            v-model="layoutType"
            mandatory
            density="compact"
            variant="outlined"
            data-testid="layout-toggle"
          >
            <v-btn value="force" size="small" data-testid="layout-force-btn">
              <v-icon start>mdi-graph</v-icon>
              力导向
            </v-btn>
            <v-btn value="hierarchical" size="small" data-testid="layout-hierarchical-btn">
              <v-icon start>mdi-file-tree</v-icon>
              分层
            </v-btn>
          </v-btn-toggle>

          <!-- 关键路径切换 -->
          <v-btn
            :color="showCriticalPath ? 'error' : 'default'"
            :variant="showCriticalPath ? 'flat' : 'outlined'"
            size="small"
            data-testid="critical-path-toggle"
            @click="toggleCriticalPath"
          >
            <v-icon start>mdi-alert-decagram</v-icon>
            关键路径
          </v-btn>

          <!-- 重置布局 -->
          <v-btn
            v-if="hasCustomLayout"
            icon="mdi-refresh"
            size="small"
            variant="text"
            data-testid="reset-layout-btn"
            @click="resetLayout"
          />

          <!-- 导出 -->
          <v-btn
            icon="mdi-download"
            size="small"
            variant="text"
            data-testid="export-dag-btn"
            @click="exportDialog?.open()"
          />
        </div>
      </v-card-title>

      <v-card-text>
        <div
          ref="containerRef"
          class="dag-container"
          :class="{ compact }"
          data-testid="dag-container"
        >
          <v-chart
            ref="chartRef"
            class="chart"
            :option="dagOption"
            autoresize
            data-testid="dag-chart"
            @click="handleNodeClick"
          />
        </div>

        <!-- 图例说明 -->
        <div v-if="!compact" class="legend-section mt-4" data-testid="dag-legend">
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">任务状态</div>
              <div class="d-flex flex-wrap gap-3">
                <v-chip
                  v-for="status in taskStatusLegend"
                  :key="status.name"
                  :color="status.color"
                  size="small"
                  variant="flat"
                >
                  {{ status.name }}
                </v-chip>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-2">依赖类型</div>
              <div class="d-flex flex-wrap gap-3">
                <v-chip
                  v-for="dep in dependencyTypeLegend"
                  :key="dep.type"
                  size="small"
                  variant="outlined"
                >
                  {{ dep.type }}: {{ dep.description }}
                </v-chip>
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>

    <!-- 导出对话框 -->
    <ExportDialog ref="exportDialog" @export="handleExport" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { useEChartsTheme, getEChartsThemeColors } from '@/shared/composables/useEChartsTheme';

import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import type { TaskForDAG } from '@/modules/task/types/task-dag.types';
import { taskDependencyGraphService } from '@/modules/task/application/services/TaskDependencyGraphService';
import type {
  GraphData,
  CriticalPathResult,
} from '@/modules/task/application/services/TaskDependencyGraphService';
import ExportDialog from '@/modules/goal/presentation/components/dag/ExportDialog.vue';
import type { ExportOptions } from '@/modules/goal/application/services/DAGExportService';
import { dagExportService } from '@/modules/goal/application/services/DAGExportService';

// 类型别名
type TaskClientDTO = TaskForDAG;

// 注册 ECharts 组件
use([GraphChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

// Props
interface Props {
  tasks: TaskClientDTO[];
  dependencies: TaskDependencyClientDTO[];
  compact?: boolean;
  syncViewport?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
  syncViewport: false,
});

// Emits
const emit = defineEmits<{
  'node-click': [task: TaskClientDTO];
  'viewport-change': [viewport: { zoom: number; center: [number, number] }];
}>();

// Refs
const chartRef = ref<InstanceType<typeof VChart>>();
const containerRef = ref<HTMLDivElement>();
const exportDialog = ref<InstanceType<typeof ExportDialog>>();

// State
const layoutType = ref<'force' | 'hierarchical'>('force');
const showCriticalPath = ref(false);
const hasCustomLayout = ref(false);
const containerSize = ref({ width: 0, height: 0 });
const isUpdatingViewport = ref(false);
const currentZoom = ref(1);
const currentCenter = ref<[number, number]>([0, 0]);

// Theme integration
useEChartsTheme(chartRef, () => dagOption.value);

// 图例数据
const taskStatusLegend = [
  { name: '已完成', color: '#52C41A' },
  { name: '进行中', color: '#1890FF' },
  { name: '就绪', color: '#FAAD14' },
  { name: '阻塞', color: '#F5222D' },
  { name: '待处理', color: '#D9D9D9' },
];

const dependencyTypeLegend = [
  { type: 'FS', description: '完成-开始' },
  { type: 'SS', description: '开始-开始' },
  { type: 'FF', description: '完成-完成' },
  { type: 'SF', description: '开始-完成' },
];

// Computed
const graphData = computed<GraphData>(() => {
  return taskDependencyGraphService.transformToGraphData(props.tasks, props.dependencies);
});

const criticalPath = computed<CriticalPathResult>(() => {
  if (!showCriticalPath.value) {
    return { path: [], duration: 0, edges: [] };
  }
  return taskDependencyGraphService.calculateCriticalPath(props.tasks, props.dependencies);
});

const hasCriticalPath = computed(() => {
  return criticalPath.value.path.length > 0;
});

const criticalPathDuration = computed(() => {
  const minutes = criticalPath.value.duration;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
});

const displayGraphData = computed<GraphData>(() => {
  let data = { ...graphData.value };

  if (showCriticalPath.value && hasCriticalPath.value) {
    data = taskDependencyGraphService.highlightCriticalPath(data, criticalPath.value);
  }

  // 加载自定义布局
  if (layoutType.value === 'force') {
    const savedPositions = loadLayout();
    if (savedPositions && savedPositions.length > 0) {
      const positionMap = new Map(savedPositions.map((p) => [p.id, { x: p.x, y: p.y }]));
      data.nodes.forEach((node) => {
        const pos = positionMap.get(node.id);
        if (pos) {
          node.x = pos.x;
          node.y = pos.y;
        }
      });
      hasCustomLayout.value = true;
    }
  }

  return data;
});

const dagOption = computed<EChartsOption>(() => {
  const { nodes, edges, categories } = displayGraphData.value;
  const themeColors = getEChartsThemeColors();

  const baseOption: EChartsOption = {
    backgroundColor: themeColors.backgroundColor,
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const task = params.data.task;
          const priorityColors: Record<string, string> = {
            CRITICAL: '#F5222D',
            HIGH: '#FF9800',
            MEDIUM: '#FAAD14',
            LOW: '#52C41A',
          };

          let html = `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">
                ${task.title}
              </div>
              <div style="margin-bottom: 4px;">
                <span style="color: #666;">状态:</span>
                <span style="margin-left: 8px; color: ${params.data.itemStyle.color};">
                  ${task.status}
                </span>
              </div>
              <div style="margin-bottom: 4px;">
                <span style="color: #666;">优先级:</span>
                <span style="margin-left: 8px; color: ${priorityColors[task.priority] || '#999'};">
                  ${task.priority}
                </span>
              </div>
          `;

          if (task.estimatedMinutes) {
            const hours = Math.floor(task.estimatedMinutes / 60);
            const mins = task.estimatedMinutes % 60;
            const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
            html += `
              <div style="margin-bottom: 4px;">
                <span style="color: #666;">预估时长:</span>
                <span style="margin-left: 8px;">${timeStr}</span>
              </div>
            `;
          }

          if (task.dueDate) {
            html += `
              <div style="margin-bottom: 4px;">
                <span style="color: #666;">截止日期:</span>
                <span style="margin-left: 8px;">${task.dueDate}</span>
              </div>
            `;
          }

          if (task.tags && task.tags.length > 0) {
            html += `
              <div style="margin-top: 8px;">
                <span style="color: #666;">标签:</span>
                <div style="margin-top: 4px;">
                  ${task.tags
                    .map(
                      (tag: string) => `
                    <span style="display: inline-block; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; margin-right: 4px; margin-top: 4px; font-size: 12px;">
                      ${tag}
                    </span>
                  `,
                    )
                    .join('')}
                </div>
              </div>
            `;
          }

          if (params.data.isCritical) {
            html += `
              <div style="margin-top: 8px; color: #F5222D; font-weight: bold;">
                ⚠️ 关键路径任务
              </div>
            `;
          }

          html += '</div>';
          return html;
        } else if (params.dataType === 'edge') {
          const depType = params.data.value;
          const typeNames: Record<string, string> = {
            FS: '完成-开始',
            SS: '开始-开始',
            FF: '完成-完成',
            SF: '开始-完成',
          };

          let html = `
            <div style="padding: 8px;">
              <div style="font-weight: bold; margin-bottom: 4px;">
                依赖关系: ${typeNames[depType] || depType}
              </div>
          `;

          if (params.data.isCritical) {
            html += `
              <div style="color: #F5222D; font-weight: bold;">
                ⚠️ 关键路径
              </div>
            `;
          }

          html += '</div>';
          return html;
        }
        return '';
      },
    },
    legend: {
      data: categories.map((c) => c.name),
      bottom: 10,
      show: !props.compact,
    },
    animationDuration: 1000,
    animationEasingUpdate: 'quinticInOut',
    series: [
      {
        type: 'graph',
        layout: layoutType.value === 'force' ? 'force' : 'none',
        data: layoutType.value === 'hierarchical' ? calculateHierarchicalLayout() : nodes,
        links: edges,
        categories,
        roam: true,
        draggable: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}',
          fontSize: 12,
        },
        labelLayout: {
          hideOverlap: true,
        },
        emphasis: {
          focus: 'adjacency',
          label: {
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        force: {
          repulsion: 400,
          edgeLength: [100, 200],
          gravity: 0.1,
          friction: 0.6,
          layoutAnimation: true,
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 10],
        lineStyle: {
          curveness: 0.2,
        },
      } as any,
    ],
  };

  return baseOption;
});

// Methods
const calculateHierarchicalLayout = () => {
  const { nodes, edges } = displayGraphData.value;

  // 拓扑排序计算层级
  const { sorted, hasCycle } = taskDependencyGraphService.topologicalSort(
    props.tasks,
    props.dependencies,
  );

  if (hasCycle) {
    console.warn('检测到循环依赖，使用默认布局');
    return nodes;
  }

  // 计算每个节点的层级
  const levels = new Map<string, number>();
  const inDegree = new Map<string, number>();

  // 初始化入度
  props.tasks.forEach((task) => inDegree.set(task.uuid, 0));
  props.dependencies.forEach((dep) => {
    inDegree.set(dep.successorTaskUuid, (inDegree.get(dep.successorTaskUuid) || 0) + 1);
  });

  // BFS 计算层级
  const queue: Array<{ uuid: string; level: number }> = [];
  props.tasks.forEach((task) => {
    if (inDegree.get(task.uuid) === 0) {
      queue.push({ uuid: task.uuid, level: 0 });
      levels.set(task.uuid, 0);
    }
  });

  const adjacencyList = new Map<string, string[]>();
  props.tasks.forEach((task) => adjacencyList.set(task.uuid, []));
  props.dependencies.forEach((dep) => {
    const successors = adjacencyList.get(dep.predecessorTaskUuid) || [];
    successors.push(dep.successorTaskUuid);
    adjacencyList.set(dep.predecessorTaskUuid, successors);
  });

  while (queue.length > 0) {
    const { uuid, level } = queue.shift()!;
    const successors = adjacencyList.get(uuid) || [];

    successors.forEach((successor) => {
      const currentLevel = levels.get(successor) || 0;
      levels.set(successor, Math.max(currentLevel, level + 1));

      const newInDegree = (inDegree.get(successor) || 0) - 1;
      inDegree.set(successor, newInDegree);

      if (newInDegree === 0) {
        queue.push({ uuid: successor, level: levels.get(successor) || 0 });
      }
    });
  }

  // 计算每层的节点数
  const levelNodes = new Map<number, string[]>();
  levels.forEach((level, uuid) => {
    const nodesInLevel = levelNodes.get(level) || [];
    nodesInLevel.push(uuid);
    levelNodes.set(level, nodesInLevel);
  });

  // 计算位置
  const width = containerSize.value.width || 800;
  const height = containerSize.value.height || 600;
  const maxLevel = Math.max(...Array.from(levels.values()));
  const levelHeight = height / (maxLevel + 2);

  return nodes.map((node) => {
    const level = levels.get(node.id) || 0;
    const nodesInLevel = levelNodes.get(level) || [];
    const indexInLevel = nodesInLevel.indexOf(node.id);
    const levelWidth = width / (nodesInLevel.length + 1);

    return {
      ...node,
      x: levelWidth * (indexInLevel + 1),
      y: levelHeight * (level + 1),
    };
  });
};

const toggleCriticalPath = () => {
  showCriticalPath.value = !showCriticalPath.value;
};

const handleNodeClick = (params: any) => {
  if (params.dataType === 'node') {
    const task = props.tasks.find((t) => t.uuid === params.data.id);
    if (task) {
      emit('node-click', task);
    }
  }
};

const saveLayout = (positions: Array<{ id: string; x: number; y: number }>) => {
  try {
    const key = 'task-dag-layout';
    localStorage.setItem(key, JSON.stringify(positions));
  } catch (error) {
    console.error('Failed to save layout:', error);
  }
};

const loadLayout = (): Array<{ id: string; x: number; y: number }> | null => {
  try {
    const key = 'task-dag-layout';
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load layout:', error);
    return null;
  }
};

const resetLayout = () => {
  try {
    localStorage.removeItem('task-dag-layout');
    hasCustomLayout.value = false;

    // 强制重新渲染
    if (chartRef.value) {
      nextTick(() => {
        chartRef.value?.setOption(dagOption.value, true);
      });
    }
  } catch (error) {
    console.error('Failed to reset layout:', error);
  }
};

const handleExport = async (options: ExportOptions) => {
  try {
    const chartInstance = chartRef.value?.chart;
    if (!chartInstance) {
      console.error('Chart instance not found');
      return;
    }

    let blob: Blob;

    switch (options.format) {
      case 'png':
        blob = await dagExportService.exportPNG(chartInstance as any, options);
        break;
      case 'svg':
        blob = await dagExportService.exportSVG(chartInstance as any, options);
        break;
      case 'pdf':
        blob = await dagExportService.exportPDF(chartInstance as any, options, {
          title: '任务依赖关系图',
          author: 'DailyUse User',
          date: new Date().toLocaleString('zh-CN'),
        });
        break;
    }

    const filename = dagExportService.generateFilename('task-dag', options.format);
    dagExportService.downloadBlob(blob, filename);

    exportDialog.value?.close();

    console.log(`Successfully exported ${options.format.toUpperCase()}: ${filename}`);
  } catch (error) {
    console.error('Export failed:', error);
    alert('导出失败，请重试');
  }
};

// 监听拖拽事件保存坐标
watch(chartRef, (chart) => {
  if (chart && layoutType.value === 'force') {
    const instance = chart.chart;
    if (!instance) return;

    instance.on('graphRoam', (params: any) => {
      if (params.type === 'graphRoam') {
        setTimeout(() => {
          const option = instance.getOption() as any;
          const series = option.series?.[0];
          if (series?.data) {
            const positions = series.data.map((node: any) => ({
              id: node.id,
              x: node.x,
              y: node.y,
            }));
            saveLayout(positions);
          }
        }, 500);

        // 视口同步
        if (props.syncViewport && !isUpdatingViewport.value) {
          const option = instance.getOption() as any;
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

// 监听布局类型变化
watch(layoutType, (newType) => {
  try {
    localStorage.setItem('task-dag-layout-type', newType);
  } catch (error) {
    console.error('Failed to save layout type:', error);
  }
});

// 响应式容器尺寸
useResizeObserver(containerRef, (entries) => {
  const entry = entries[0];
  const { width, height } = entry.contentRect;

  if (width > 0 && height > 0) {
    containerSize.value = { width, height };

    if (layoutType.value === 'hierarchical') {
      nextTick(() => {
        if (chartRef.value) {
          chartRef.value.setOption(dagOption.value, true);
        }
      });
    }
  }
});

// 暴露方法
const updateViewport = (viewport: { zoom: number; center: [number, number] }) => {
  if (!chartRef.value || !props.syncViewport) return;

  isUpdatingViewport.value = true;

  try {
    const instance = chartRef.value.chart;
    if (!instance) return;

    const currentOption = instance.getOption() as any;

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
    setTimeout(() => {
      isUpdatingViewport.value = false;
    }, 100);
  }
};

defineExpose({
  updateViewport,
  chartRef,
  exportDialog,
});

// 初始化
onMounted(() => {
  try {
    const savedType = localStorage.getItem('task-dag-layout-type');
    if (savedType === 'force' || savedType === 'hierarchical') {
      layoutType.value = savedType;
    }
  } catch (error) {
    console.error('Failed to load layout type:', error);
  }
});
</script>

<style scoped>
.task-dag-visualization {
  width: 100%;
}

.dag-container {
  width: 100%;
  min-width: 600px;
  min-height: 400px;
  height: 600px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.02);
  position: relative;
}

.dag-container.compact {
  min-width: 300px;
  min-height: 300px;
  height: 400px;
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

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}
</style>

