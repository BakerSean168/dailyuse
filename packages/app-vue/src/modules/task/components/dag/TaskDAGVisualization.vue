<template>
  <div class="task-dag-visualization w-full" data-testid="task-dag-visualization">
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <div class="flex items-center gap-2">
          <Network class="h-5 w-5 text-primary" />
          <CardTitle class="text-lg">{{ t('task.dagVisualization.title') }}</CardTitle>
          <Badge v-if="showCriticalPath && criticalPathDuration > 0" variant="destructive">
            {{ t('task.dagVisualization.criticalPathLabel') }} {{ criticalPathDuration
            }}{{ t('task.dagVisualization.minutes') }}
          </Badge>
        </div>

        <div class="flex items-center gap-2">
          <div class="inline-flex rounded-md border">
            <Button
              :variant="layoutType === 'force' ? 'default' : 'ghost'"
              size="sm"
              @click="layoutType = 'force'"
            >
              <Network class="h-4 w-4 mr-1" />
              {{ t('task.dagVisualization.forceLayout') }}
            </Button>
            <Button
              :variant="layoutType === 'hierarchical' ? 'default' : 'ghost'"
              size="sm"
              @click="layoutType = 'hierarchical'"
            >
              <Network class="h-4 w-4 mr-1" />
              {{ t('task.dagVisualization.layeredLayout') }}
            </Button>
          </div>

          <Button
            :variant="showCriticalPath ? 'destructive' : 'outline'"
            size="sm"
            @click="showCriticalPath = !showCriticalPath"
          >
            <AlertTriangle class="h-4 w-4 mr-1" />
            {{ t('task.dagVisualization.criticalPath') }}
          </Button>

          <Button variant="ghost" size="icon" @click="exportJson">
            <Download class="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div class="w-full" :class="compact ? 'h-[420px]' : 'h-[560px]'">
          <v-chart class="w-full h-full" :option="dagOption" autoresize @click="handleNodeClick" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ECElementEvent, GraphSeriesOption } from 'echarts';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@dailyuse/ui-vue-shadcn';
import { Network, AlertTriangle, Download } from '@lucide/vue';
import { TaskGraphEdgeKind } from '@dailyuse/task/client';
import type { TaskForDAGViewModel, TaskGraphDataViewModel, TaskGraphEdgeViewModel } from '../types';

use([GraphChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const props = withDefaults(
  defineProps<{
    graphData: TaskGraphDataViewModel;
    activeNodeId?: string | null;
    compact?: boolean;
  }>(),
  {
    activeNodeId: null,
    compact: false,
  },
);

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'node-click', task: TaskForDAGViewModel): void;
}>();

const layoutType = ref<'force' | 'hierarchical'>('force');
const showCriticalPath = ref(false);

const taskById = computed(() => new Map(props.graphData.nodes.map((task) => [task.id, task])));

const dependencyAdjacency = computed(() => {
  const map = new Map<string, string[]>();
  props.graphData.nodes.forEach((task) => map.set(task.id, []));
  props.graphData.dependencyEdges.forEach((edge) => {
    if (!map.has(edge.source)) map.set(edge.source, []);
    map.get(edge.source)?.push(edge.target);
  });
  return map;
});

const criticalPath = computed(() => {
  const indegree = new Map<string, number>();
  const predecessor = new Map<string, string | null>();
  const longest = new Map<string, number>();

  props.graphData.nodes.forEach((task) => {
    indegree.set(task.id, 0);
    predecessor.set(task.id, null);
    longest.set(task.id, task.estimatedMinutes || 0);
  });

  props.graphData.dependencyEdges.forEach((edge) => {
    indegree.set(edge.target, (indegree.get(edge.target) || 0) + 1);
  });

  const queue: string[] = [];
  indegree.forEach((value, key) => {
    if (value === 0) queue.push(key);
  });

  while (queue.length) {
    const current = queue.shift()!;
    for (const next of dependencyAdjacency.value.get(current) || []) {
      const nextTask = taskById.value.get(next);
      const candidate = (longest.get(current) || 0) + (nextTask?.estimatedMinutes || 0);
      if (candidate > (longest.get(next) || 0)) {
        longest.set(next, candidate);
        predecessor.set(next, current);
      }
      indegree.set(next, (indegree.get(next) || 0) - 1);
      if ((indegree.get(next) || 0) === 0) queue.push(next);
    }
  }

  let endNode: string | null = null;
  let maxDuration = 0;
  longest.forEach((value, key) => {
    if (value > maxDuration) {
      maxDuration = value;
      endNode = key;
    }
  });

  const path: string[] = [];
  let cursor: string | null = endNode;
  while (cursor) {
    path.unshift(cursor);
    cursor = predecessor.get(cursor) || null;
  }

  return {
    path,
    duration: maxDuration,
  };
});

const criticalPathDuration = computed(() => criticalPath.value.duration);
const hierarchyDepths = computed(() => {
  const depthById = new Map<string, number>();
  const visiting = new Set<string>();

  const resolveDepth = (taskId: string): number => {
    if (depthById.has(taskId)) return depthById.get(taskId)!;
    if (visiting.has(taskId)) return 0;

    visiting.add(taskId);
    const task = taskById.value.get(taskId);
    const parentDepth =
      task?.parentTaskId && taskById.value.has(task.parentTaskId)
        ? resolveDepth(task.parentTaskId) + 1
        : 0;

    const predecessorDepths = (props.graphData.dependencyEdges || [])
      .filter((edge) => edge.target === taskId)
      .map((edge) => resolveDepth(edge.source) + 1);

    const depth = Math.max(parentDepth, ...predecessorDepths, 0);
    depthById.set(taskId, depth);
    visiting.delete(taskId);
    return depth;
  };

  props.graphData.nodes.forEach((task) => {
    resolveDepth(task.id);
  });

  return depthById;
});

const hierarchicalPositions = computed(() => {
  const nodesByDepth = new Map<number, TaskForDAGViewModel[]>();

  props.graphData.nodes.forEach((task) => {
    const depth = hierarchyDepths.value.get(task.id) ?? 0;
    const bucket = nodesByDepth.get(depth) ?? [];
    bucket.push(task);
    nodesByDepth.set(depth, bucket);
  });

  const positions = new Map<string, { x: number; y: number }>();
  [...nodesByDepth.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([depth, tasks]) => {
      tasks.forEach((task, index) => {
        positions.set(task.id, {
          x: depth * 260,
          y: index * 120,
        });
      });
    });

  return positions;
});

const dagOption = computed(() => {
  const criticalSet = new Set(showCriticalPath.value ? criticalPath.value.path : []);

  const nodes = props.graphData.nodes.map((task) => {
    const position = hierarchicalPositions.value.get(task.id);
    const isBlocked = task.isBlocked || task.dependencyStatus === 'Blocked';
    const isActiveNode = props.activeNodeId === task.id;
    return {
      id: task.id,
      name: task.title,
      value: task.estimatedMinutes || 0,
      x: layoutType.value === 'hierarchical' ? position?.x ?? 0 : undefined,
      y: layoutType.value === 'hierarchical' ? position?.y ?? 0 : undefined,
      symbolSize: isActiveNode ? 60 : criticalSet.has(task.id) ? 52 : 42,
      itemStyle: {
        color: criticalSet.has(task.id)
          ? '#E53935'
          : isBlocked
            ? '#F97316'
            : task.status === 'COMPLETED'
              ? '#4CAF50'
              : '#2196F3',
        borderColor: isActiveNode ? '#0F172A' : '#FFFFFF',
        borderWidth: isActiveNode ? 4 : 2,
        shadowBlur: isActiveNode ? 20 : 0,
        shadowColor: isActiveNode ? 'rgba(15, 23, 42, 0.35)' : 'transparent',
      },
      label: { show: true },
      task,
    };
  });

  const links = props.graphData.edges.map((edge) => {
    const isCriticalDependency =
      edge.kind === TaskGraphEdgeKind.Dependency &&
      criticalSet.has(edge.source) &&
      criticalSet.has(edge.target);

    return {
      source: edge.source,
      target: edge.target,
      value: edge.kind === TaskGraphEdgeKind.Dependency ? edge.dependencyType : edge.kind,
      lineStyle: {
        color:
          edge.kind === TaskGraphEdgeKind.Hierarchy
            ? '#94A3B8'
            : isCriticalDependency
              ? '#E53935'
              : '#9E9E9E',
        width: edge.kind === TaskGraphEdgeKind.Hierarchy ? 1.25 : isCriticalDependency ? 3 : 1.5,
        type: edge.kind === TaskGraphEdgeKind.Hierarchy ? 'dashed' : 'solid',
      },
      edgeSymbol: edge.kind === TaskGraphEdgeKind.Hierarchy ? ['none', 'none'] : ['none', 'arrow'],
      edgeSymbolSize: edge.kind === TaskGraphEdgeKind.Hierarchy ? [0, 0] : [0, 8],
      edge,
    };
  });

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: ECElementEvent) => {
        const data = params.data as Record<string, unknown> | undefined;
        if (params.dataType === 'node' && data?.task) {
          const task = data.task as TaskForDAGViewModel;
          const dependencyLine = task.dependencyStatus
            ? `<br/>Dependency ${task.dependencyStatus}`
            : '';
          const blockedLine = task.blockingReason ? `<br/>Blocked ${task.blockingReason}` : '';
          return `<div><b>${task.title}</b><br/>${t('task.dagVisualization.statusTooltip')} ${task.status || 'UNKNOWN'}<br/>${t('task.dagVisualization.durationTooltip')} ${task.estimatedMinutes || 0} ${t('task.dagVisualization.minuteUnit')}${dependencyLine}${blockedLine}</div>`;
        }
        if (params.dataType === 'edge' && data?.edge) {
          const edge = data.edge as TaskGraphEdgeViewModel;
          const relation =
            edge.kind === TaskGraphEdgeKind.Hierarchy
              ? 'Hierarchy'
              : edge.dependencyType || 'Dependency';
          return `<div><b>${relation}</b><br/>${edge.source} → ${edge.target}</div>`;
        }
        return '';
      },
    },
    series: [
      {
        type: 'graph',
        layout: layoutType.value === 'force' ? 'force' : 'none',
        data: nodes,
        links,
        roam: true,
        draggable: true,
        label: {
          show: true,
          position: 'right',
        },
        lineStyle: {
          curveness: 0.2,
        },
        force: {
          repulsion: 360,
          edgeLength: [80, 180],
        },
      } as GraphSeriesOption,
    ],
  };
});

const handleNodeClick = (params: unknown) => {
  const event = params as ECElementEvent;
  const data = event.data as Record<string, unknown> | undefined;
  if (data?.task) {
    emit('node-click', data.task as TaskForDAGViewModel);
  }
};

const exportJson = () => {
  const payload = {
    graphData: props.graphData,
    criticalPath: criticalPath.value,
    exportedAt: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `task-dag-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};
</script>
