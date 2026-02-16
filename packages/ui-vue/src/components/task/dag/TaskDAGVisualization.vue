<template>
  <div class="task-dag-visualization" data-testid="task-dag-visualization">
    <v-card elevation="2">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-icon color="primary">mdi-graph-outline</v-icon>
          <span class="text-h6">任务依赖关系图</span>
          <v-chip v-if="showCriticalPath && criticalPathDuration > 0" color="error" size="small" variant="flat">
            关键路径: {{ criticalPathDuration }}分钟
          </v-chip>
        </div>

        <div class="d-flex align-center gap-2">
          <v-btn-toggle v-model="layoutType" mandatory density="compact" variant="outlined">
            <v-btn value="force" size="small"><v-icon start>mdi-graph</v-icon>力导向</v-btn>
            <v-btn value="hierarchical" size="small"><v-icon start>mdi-file-tree</v-icon>分层</v-btn>
          </v-btn-toggle>

          <v-btn :color="showCriticalPath ? 'error' : 'default'" :variant="showCriticalPath ? 'flat' : 'outlined'" size="small" @click="showCriticalPath = !showCriticalPath">
            <v-icon start>mdi-alert-decagram</v-icon>
            关键路径
          </v-btn>

          <v-btn icon="mdi-download" size="small" variant="text" @click="exportJson" />
        </div>
      </v-card-title>

      <v-card-text>
        <div class="dag-container" :class="{ compact }">
          <v-chart class="chart" :option="dagOption" autoresize @click="handleNodeClick" />
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import VChart from 'vue-echarts';
import { use } from 'echarts/core';
import { GraphChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import type { TaskForDAGViewModel } from '../types';

use([GraphChart, TitleComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface Props {
  tasks: TaskForDAGViewModel[];
  dependencies: TaskDependencyClientDTO[];
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  compact: false,
});

const emit = defineEmits<{
  (e: 'node-click', task: TaskForDAGViewModel): void;
}>();

const layoutType = ref<'force' | 'hierarchical'>('force');
const showCriticalPath = ref(false);

const adjacency = computed(() => {
  const map = new Map<string, string[]>();
  props.tasks.forEach((task) => map.set(task.uuid, []));
  props.dependencies.forEach((dep) => {
    const predecessor = dep.predecessorTaskUuid;
    const successor = dep.successorTaskUuid;
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
    indegree.set(task.uuid, 0);
    predecessor.set(task.uuid, null);
    longest.set(task.uuid, task.estimatedMinutes || 0);
  });

  props.dependencies.forEach((dep) => {
    indegree.set(dep.successorTaskUuid, (indegree.get(dep.successorTaskUuid) || 0) + 1);
  });

  const queue: string[] = [];
  indegree.forEach((value, key) => {
    if (value === 0) queue.push(key);
  });

  while (queue.length) {
    const current = queue.shift()!;
    for (const next of adjacency.value.get(current) || []) {
      const nextTask = props.tasks.find((task) => task.uuid === next);
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
  let cursor = endNode;
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
    id: task.uuid,
    name: task.title,
    value: task.estimatedMinutes || 0,
    symbolSize: criticalSet.has(task.uuid) ? 52 : 42,
    itemStyle: {
      color: criticalSet.has(task.uuid) ? '#E53935' : task.status === 'COMPLETED' ? '#4CAF50' : '#2196F3',
    },
    label: { show: true },
    task,
  }));

  const links = props.dependencies.map((dep) => ({
    source: dep.predecessorTaskUuid,
    target: dep.successorTaskUuid,
    value: dep.dependencyType,
    lineStyle: {
      color:
        criticalSet.has(dep.predecessorTaskUuid) && criticalSet.has(dep.successorTaskUuid)
          ? '#E53935'
          : '#9E9E9E',
      width:
        criticalSet.has(dep.predecessorTaskUuid) && criticalSet.has(dep.successorTaskUuid)
          ? 3
          : 1.5,
    },
  }));

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        if (params.dataType === 'node') {
          const task = params.data.task as TaskForDAGViewModel;
          return `<div><b>${task.title}</b><br/>状态: ${task.status || 'UNKNOWN'}<br/>预计时长: ${task.estimatedMinutes || 0} 分钟</div>`;
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

<style scoped>
.task-dag-visualization {
  width: 100%;
}

.dag-container {
  width: 100%;
  height: 560px;
}

.dag-container.compact {
  height: 420px;
}

.chart {
  width: 100%;
  height: 100%;
}
</style>
