<template>
  <Card class="h-full flex flex-col">
    <CardHeader class="flex flex-row items-center space-x-2 p-3">
      <Network class="h-5 w-5 text-primary" />
      <CardTitle class="text-lg">链接图谱</CardTitle>
      <div class="flex-1" />
      
      <ToggleGroup v-model="currentDepthStr" type="single" class="mr-2">
        <ToggleGroupItem value="1" aria-label="1 层" class="h-8 px-3 text-xs">1 层</ToggleGroupItem>
        <ToggleGroupItem value="2" aria-label="2 层" class="h-8 px-3 text-xs">2 层</ToggleGroupItem>
        <ToggleGroupItem value="3" aria-label="3 层" class="h-8 px-3 text-xs">3 层</ToggleGroupItem>
      </ToggleGroup>

      <Button variant="ghost" size="icon" class="h-8 w-8" @click="refresh" :disabled="loading">
        <RotateCw :class="['h-4 w-4', loading && 'animate-spin']" />
      </Button>
      <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('close')">
        <X class="h-4 w-4" />
      </Button>
    </CardHeader>

    <Separator />

    <CardContent class="flex-1 p-0 relative">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center h-full p-8">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
        <p class="text-sm text-muted-foreground">生成图谱中...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="graphData.nodes.length === 0" class="flex flex-col items-center justify-center h-full p-8 text-center">
        <Network class="h-20 w-20 text-muted-foreground/50 mb-4" />
        <p class="text-lg font-semibold text-muted-foreground">暂无关联文档</p>
        <p class="text-sm text-muted-foreground mt-1">创建链接后图谱会显示在这里</p>
      </div>

      <!-- ECharts Graph -->
      <div v-else ref="chartRef" class="w-full h-[600px] min-h-[400px]" />

      <!-- Legend -->
      <div v-if="!loading && graphData.nodes.length > 0" class="border-t bg-muted/20 p-3 flex items-center justify-center gap-2 flex-wrap">
        <Badge variant="outline">
          <div class="w-2 h-2 rounded-full bg-primary mr-1.5"></div>
          当前文档
        </Badge>
        <Badge variant="outline">
          <div class="w-2 h-2 rounded-full bg-muted-foreground mr-1.5"></div>
          关联文档
        </Badge>
        <Badge variant="secondary">
          节点: {{ graphData.nodes.length }} | 链接: {{ graphData.edges.length }}
        </Badge>
      </div>
    </CardContent>

    <!-- Error Alert -->
    <Alert v-if="error" variant="destructive" class="m-3">
      <AlertCircle class="h-4 w-4" />
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ToggleGroup, ToggleGroupItem } from '../../ui/toggle-group';
import { Separator } from '../../ui/separator';
import { Alert, AlertDescription } from '../../ui/alert';
import { Network, RotateCw, X, AlertCircle } from 'lucide-vue-next';
import * as echarts from 'echarts';

interface LinkGraphNodeDTO {
  uuid: string;
  title: string;
  isCenter: boolean;
  isCurrent: boolean;
  linkCount: number;
  backlinkCount: number;
  depth: number;
}

interface LinkGraphEdgeDTO {
  sourceUuid: string;
  targetUuid: string;
  source: string;
  target: string;
  linkText?: string;
}

interface LinkGraphResponseDTO {
  nodes: LinkGraphNodeDTO[];
  edges: LinkGraphEdgeDTO[];
  centerUuid: string;
  depth: number;
}

interface Props {
  documentUuid: string;
  initialDepth?: number;
}

const props = withDefaults(defineProps<Props>(), {
  initialDepth: 2,
});

const emit = defineEmits<{
  close: [];
  nodeClick: [nodeUuid: string];
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const currentDepth = ref(props.initialDepth);
const currentDepthStr = computed({
  get: () => String(currentDepth.value),
  set: (val: string) => { currentDepth.value = Number(val); },
});
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const graphData = ref<LinkGraphResponseDTO>({
  nodes: [],
  edges: [],
  centerUuid: props.documentUuid,
  depth: currentDepth.value,
});

async function loadLinkGraph() {
  if (!props.documentUuid) return;

  loading.value = true;
  error.value = null;

  try {
    graphData.value = { nodes: [], edges: [], centerUuid: props.documentUuid, depth: currentDepth.value };
    error.value = '链接图谱功能正在开发中';
    
    await nextTick();
    renderGraph();
  } catch (err: any) {
    console.error('Load link graph failed:', err);
    error.value = err.message || '加载链接图谱失败';
    graphData.value = { nodes: [], edges: [], centerUuid: props.documentUuid, depth: currentDepth.value };
  } finally {
    loading.value = false;
  }
}

function renderGraph() {
  if (!chartRef.value || graphData.value.nodes.length === 0) return;

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  }

  const nodes = graphData.value.nodes.map((node: LinkGraphNodeDTO) => ({
    id: node.uuid,
    name: node.title,
    symbolSize: node.isCurrent ? 60 : 40 + Math.min(node.linkCount + node.backlinkCount, 20) * 2,
    value: node.linkCount + node.backlinkCount,
    itemStyle: {
      color: node.isCurrent ? '#1976d2' : '#90caf9',
    },
    label: {
      show: true,
      formatter: '{b}',
    },
  }));

  const links = graphData.value.edges.map((edge: LinkGraphEdgeDTO) => ({
    source: edge.source,
    target: edge.target,
    label: {
      show: false,
      formatter: edge.linkText,
    },
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          return `${params.data.name}<br/>链接数: ${params.data.value}`;
        }
        return '';
      },
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: nodes,
        links: links,
        roam: true,
        draggable: true,
        force: {
          repulsion: 200,
          gravity: 0.1,
          edgeLength: 150,
          layoutAnimation: true,
        },
        emphasis: {
          focus: 'adjacency',
          lineStyle: {
            width: 3,
          },
        },
        lineStyle: {
          color: '#ccc',
          width: 2,
          curveness: 0.3,
        },
      },
    ],
  };

  chartInstance.setOption(option);

  chartInstance.off('click');
  chartInstance.on('click', (params: any) => {
    if (params.dataType === 'node') {
      emit('nodeClick', params.data.id);
    }
  });
}

function refresh() {
  loadLinkGraph();
}

function resizeChart() {
  if (chartInstance) {
    chartInstance.resize();
  }
}

watch(() => props.documentUuid, () => {
  loadLinkGraph();
});

watch(currentDepth, () => {
  loadLinkGraph();
});

onMounted(() => {
  loadLinkGraph();
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', resizeChart);
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }
});
</script>
