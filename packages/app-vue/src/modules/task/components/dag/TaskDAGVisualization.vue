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
import type { EChartsOption } from 'echarts';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@dailyuse/ui-vue-shadcn';
import { Network, AlertTriangle, Download } from 'lucide-vue-next';
import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import type { TaskForDAGViewModel } from '../types';

use([GraphChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const props = withDefaults(
  defineProps<{
    tasks: TaskForDAGViewModel[];
    dependencies: TaskDependencyClientDTO[];
    compact?: boolean;
  }>(),
  {
    compact: false,
  },
);

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'node-click', task: TaskForDAGViewModel): void;
}>();

const layoutType = ref<'force' | 'hierarchical'>('force');
const showCriticalPath = ref(false);

const adjacency = computed(() => {
  const map = new Map<string, string[]>();
  props.tasks.forEach((task) => map.set(task.id, []));
  props.dependencies.forEach((dep) => {
    const predecessor = dep.predecessorTaskId;
    const successor = dep.successorTaskId;
    if (!map.has(predecessor)) map.set(predecessor, []);
    map.get(predecessor)?.push(successor);
  });
  return map;
});

const criticalPath = computed(() => {
  const indegree = new Map<string, number>();
  const predecessor = new Map<string, string | null>();
  const longest = new Map<string, number>();

  props.tasks.forEach((task) => {
    indegree.set(task.id, 0);
    predecessor.set(task.id, null);
    longest.set(task.id, task.estimatedMinutes || 0);
  });

  props.dependencies.forEach((dep) => {
    indegree.set(dep.successorTaskId, (indegree.get(dep.successorTaskId) || 0) + 1);
  });

  const queue: string[] = [];
  indegree.forEach((value, key) => {
    if (value === 0) queue.push(key);
  });

  while (queue.length) {
    const current = queue.shift()!;
    for (const next of adjacency.value.get(current) || []) {
      const nextTask = props.tasks.find((task) => task.id === next);
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

const dagOption = computed<EChartsOption>(() => {
  const criticalSet = new Set(showCriticalPath.value ? criticalPath.value.path : []);

  const nodes = props.tasks.map((task) => ({
    id: task.id,
    name: task.title,
    value: task.estimatedMinutes || 0,
    symbolSize: criticalSet.has(task.id) ? 52 : 42,
    itemStyle: {
      color: criticalSet.has(task.id)
        ? '#E53935'
        : task.status === 'COMPLETED'
          ? '#4CAF50'
          : '#2196F3',
    },
    label: { show: true },
    task,
  }));

  const links = props.dependencies.map((dep) => ({
    source: dep.predecessorTaskId,
    target: dep.successorTaskId,
    value: dep.dependencyType,
    lineStyle: {
      color:
        criticalSet.has(dep.predecessorTaskId) && criticalSet.has(dep.successorTaskId)
          ? '#E53935'
          : '#9E9E9E',
      width:
        criticalSet.has(dep.predecessorTaskId) && criticalSet.has(dep.successorTaskId) ? 3 : 1.5,
    },
  }));

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const task = params.data.task as TaskForDAGViewModel;
          return `<div><b>${task.title}</b><br/>${t('task.dagVisualization.statusTooltip')} ${task.status || 'UNKNOWN'}<br/>${t('task.dagVisualization.durationTooltip')} ${task.estimatedMinutes || 0} ${t('task.dagVisualization.minuteUnit')}</div>`;
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
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [0, 8],
      } as any,
    ],
  };
});

const handleNodeClick = (params: any) => {
  if (params?.data?.task) {
    emit('node-click', params.data.task as TaskForDAGViewModel);
  }
};

const exportJson = () => {
  const payload = {
    tasks: props.tasks,
    dependencies: props.dependencies,
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
