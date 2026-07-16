<template>
  <Card class="h-full flex flex-col">
    <CardHeader class="flex flex-row items-center space-x-2 p-3">
      <Network class="h-5 w-5 text-primary" />
      <CardTitle class="text-lg">{{ t('editor.linkGraph.title') }}</CardTitle>
      <div class="flex-1" />

      <ToggleGroup v-model="currentDepthStr" type="single" class="mr-2">
        <ToggleGroupItem
          value="1"
          :aria-label="t('editor.linkGraph.depth', { n: 1 })"
          class="h-8 px-3 text-xs"
          >{{ t('editor.linkGraph.depth', { n: 1 }) }}</ToggleGroupItem
        >
        <ToggleGroupItem
          value="2"
          :aria-label="t('editor.linkGraph.depth', { n: 2 })"
          class="h-8 px-3 text-xs"
          >{{ t('editor.linkGraph.depth', { n: 2 }) }}</ToggleGroupItem
        >
        <ToggleGroupItem
          value="3"
          :aria-label="t('editor.linkGraph.depth', { n: 3 })"
          class="h-8 px-3 text-xs"
          >{{ t('editor.linkGraph.depth', { n: 3 }) }}</ToggleGroupItem
        >
      </ToggleGroup>

        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :aria-label="t('common.refresh')"
          :disabled="loading"
          @click="refresh"
        >
        <RotateCw :class="['h-4 w-4', loading && 'animate-spin']" />
      </Button>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
        <X class="h-4 w-4" />
      </Button>
    </CardHeader>

    <Separator />

    <CardContent class="flex-1 p-0 relative">
      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center h-full p-8">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mb-4"></div>
        <p class="text-sm text-muted-foreground">{{ t('editor.linkGraph.loading') }}</p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="graphData.nodes.length === 0"
        class="flex flex-col items-center justify-center h-full p-8 text-center"
      >
        <Network class="h-20 w-20 text-muted-foreground/50 mb-4" />
        <p class="text-lg font-semibold text-muted-foreground">{{ t('editor.linkGraph.empty') }}</p>
        <p class="text-sm text-muted-foreground mt-1">
          {{ t('editor.linkGraph.emptyDescription') }}
        </p>
      </div>

      <!-- ECharts Graph -->
      <div v-else ref="chartRef" class="w-full h-[600px] min-h-[400px]" />

      <!-- Legend -->
      <div
        v-if="!loading && graphData.nodes.length > 0"
        class="border-t bg-muted/20 p-3 flex items-center justify-center gap-2 flex-wrap"
      >
        <Badge variant="outline">
          <div class="w-2 h-2 rounded-full bg-primary mr-1.5"></div>
          {{ t('editor.linkGraph.currentNote') }}
        </Badge>
        <Badge variant="outline">
          <div class="w-2 h-2 rounded-full bg-muted-foreground mr-1.5"></div>
          {{ t('editor.linkGraph.linkedNote') }}
        </Badge>
        <Badge variant="secondary">
          {{ t('editor.linkGraph.nodeCount') }} {{ graphData.nodes.length }} |
          {{ t('editor.linkGraph.linkCount') }} {{ graphData.edges.length }}
        </Badge>
        <Badge v-if="graphData.truncated" variant="secondary">
          {{ t('editor.linkGraph.truncated') }}
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
import { useI18n } from 'vue-i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@dailyuse/ui-vue-shadcn';
import { Button } from '@dailyuse/ui-vue-shadcn';
import { Badge } from '@dailyuse/ui-vue-shadcn';
import { ToggleGroup, ToggleGroupItem } from '@dailyuse/ui-vue-shadcn';
import { Separator } from '@dailyuse/ui-vue-shadcn';
import { Alert, AlertDescription } from '@dailyuse/ui-vue-shadcn';
import { Network, RotateCw, X, AlertCircle } from '@lucide/vue';
import * as echarts from 'echarts';
import { useEditorLinkIndex } from '../composables/useEditorLinkIndex';
import type { LinkGraphData, LinkGraphEdge, LinkGraphNode } from '../utils/link-index';

const { t } = useI18n();

const { ensureResourcesLoaded, getGraph } = useEditorLinkIndex();

const props = withDefaults(
  defineProps<{
    noteId: string;
    initialDepth?: number;
  }>(),
  {
    initialDepth: 2,
  },
);

const emit = defineEmits<{
  close: [];
  nodeClick: [nodeId: string];
}>();

const loading = ref(false);
const error = ref<string | null>(null);
const currentDepth = ref(props.initialDepth);
const currentDepthStr = computed({
  get: () => String(currentDepth.value),
  set: (val: string) => {
    currentDepth.value = Number(val);
  },
});
const chartRef = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

const graphData = ref<LinkGraphData>({
  nodes: [],
  edges: [],
  centerId: props.noteId,
  depth: currentDepth.value,
  truncated: false,
});

async function loadLinkGraph() {
  if (!props.noteId) return;

  loading.value = true;
  error.value = null;

  try {
    graphData.value = {
      nodes: [],
      edges: [],
      centerId: props.noteId,
      depth: currentDepth.value,
      truncated: false,
    };
    await ensureResourcesLoaded();
    graphData.value = getGraph(props.noteId, currentDepth.value, {
      maxNodes: 40,
      maxEdges: 80,
    });

    await nextTick();
    renderGraph();
  } catch (err: unknown) {
    console.error('Load link graph failed:', err);
    error.value = err instanceof Error ? err.message : t('editor.linkGraph.loadFailed');
    graphData.value = {
      nodes: [],
      edges: [],
      centerId: props.noteId,
      depth: currentDepth.value,
      truncated: false,
    };
  } finally {
    loading.value = false;
  }
}

function renderGraph() {
  if (!chartRef.value || graphData.value.nodes.length === 0) return;

  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value);
  } else if (graphData.value.nodes.length === 0) {
    chartInstance.clear();
  }

  const nodes = graphData.value.nodes.map((node: LinkGraphNode) => ({
    id: node.id,
    name: node.title,
    symbolSize: node.isCurrent
      ? 64
      : 28 + Math.min(node.linkCount + node.backlinkCount + (3 - node.depth), 18) * 2,
    value: node.linkCount + node.backlinkCount,
    itemStyle: {
      color: node.isCurrent ? '#1d4ed8' : node.depth === 1 ? '#0f766e' : '#7c3aed',
    },
    label: {
      show: true,
      formatter: '{b}',
    },
  }));

  const links = graphData.value.edges.map((edge: LinkGraphEdge) => ({
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
      formatter: (params: { dataType?: string; data?: { name: string; value: number } }) => {
        if (params.dataType === 'node') {
          return t('editor.linkGraph.linkCountTooltip', {
            name: params.data?.name ?? '',
            count: params.data?.value ?? 0,
          });
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
          repulsion: 280,
          gravity: 0.1,
          edgeLength: 120,
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
  chartInstance.on('click', (params: unknown) => {
    const clickParams = params as { dataType?: string; data?: unknown };
    if (clickParams.dataType === 'node') {
      const nodeId =
        clickParams.data && typeof clickParams.data === 'object' && 'id' in clickParams.data
          ? String((clickParams.data as { id?: unknown }).id ?? '')
          : '';
      if (nodeId) {
        emit('nodeClick', nodeId);
      }
    }
  });
}

function refresh() {
  void loadLinkGraph();
}

function resizeChart() {
  if (chartInstance) {
    chartInstance.resize();
  }
}

watch(
  () => props.noteId,
  () => {
    void loadLinkGraph();
  },
);

watch(currentDepth, () => {
  void loadLinkGraph();
});

onMounted(() => {
  void loadLinkGraph();
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
