<template>
  <v-card class="dependency-manager">
    <v-card-title>
      <v-icon class="mr-2">mdi-link-variant</v-icon>
      管理任务依赖
    </v-card-title>

    <v-card-text>
      <div v-if="currentDependencies.length > 0" class="mb-4">
        <div class="text-subtitle-2 mb-2">当前依赖 ({{ currentDependencies.length }})</div>
        <v-list density="compact">
          <v-list-item v-for="dep in currentDependencies" :key="dep.id" class="px-0">
            <template #prepend>
              <v-icon :color="getDependencyTypeColor(dep.dependencyType)" size="small">
                {{ getDependencyTypeIcon(dep.dependencyType) }}
              </v-icon>
            </template>
            <v-list-item-title>
              {{ getTaskTitle(dep.predecessorTaskId) }}
              <v-icon size="x-small" class="mx-1">mdi-arrow-right</v-icon>
              {{ getTaskTitle(dep.successorTaskId) }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ getDependencyTypeName(dep.dependencyType) }}</v-list-item-subtitle>
            <template #append>
              <v-btn icon="mdi-delete" size="x-small" variant="text" @click="emit('dependency-deleted', dep.id)" />
            </template>
          </v-list-item>
        </v-list>
      </div>

      <v-divider class="my-4" />
      <div class="text-subtitle-2 mb-3">添加新依赖</div>

      <v-row>
        <v-col cols="12" md="5">
          <v-select
            v-model="newDependency.predecessorId"
            :items="availablePredecessors"
            item-title="title"
            item-value="id"
            label="前置任务"
            density="compact"
            :disabled="!currentTaskId"
          />
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="newDependency.dependencyType"
            :items="dependencyTypeOptions"
            item-title="label"
            item-value="value"
            label="依赖类型"
            density="compact"
          />
        </v-col>

        <v-col cols="12" md="4" class="d-flex align-center">
          <v-btn color="primary" :disabled="!canAddDependency" @click="handleAddDependency">
            <v-icon start>mdi-plus</v-icon>
            添加依赖
          </v-btn>
        </v-col>
      </v-row>

      <v-alert v-if="validationWarnings.length > 0" type="warning" density="compact" class="mt-3">
        <ul class="pl-4 mb-0">
          <li v-for="(warning, index) in validationWarnings" :key="index">{{ warning.message }}</li>
        </ul>
      </v-alert>

      <BlockedTaskInfo
        v-if="currentTaskId && blockingInfo"
        :blocking-tasks="blockingInfo.blockingTasks"
        :total-predecessors="blockingInfo.totalPredecessors"
        class="mt-4"
      />
    </v-card-text>

    <DependencyValidationDialog v-model="showValidationDialog" :error="validationError" :tasks="allTasks" @view-graph="emit('view-graph')" />
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DependencyType, type TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import DependencyValidationDialog from './DependencyValidationDialog.vue';
import BlockedTaskInfo from './BlockedTaskInfo.vue';
import type {
  TaskForDAGViewModel,
  TaskDependencyValidationError,
  TaskDependencyValidationWarning,
} from '../types';

interface Props {
  currentTaskId?: string;
  allTasks: TaskForDAGViewModel[];
  dependencies: TaskDependencyClientDTO[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'dependency-added', dependency: { predecessorTaskId: string; successorTaskId: string; dependencyType: string }): void;
  (e: 'dependency-deleted', dependencyId: string): void;
  (e: 'view-graph'): void;
}>();

const newDependency = ref({
  predecessorId: '',
  dependencyType: DependencyType.FINISH_TO_START,
});

const validationError = ref<TaskDependencyValidationError | null>(null);
const validationWarnings = ref<TaskDependencyValidationWarning[]>([]);
const showValidationDialog = ref(false);

const currentDependencies = computed(() => {
  if (!props.currentTaskId) return [];
  return props.dependencies.filter((dep) => dep.successorTaskId === props.currentTaskId);
});

const availablePredecessors = computed(() => {
  if (!props.currentTaskId) return [];
  return props.allTasks.filter((task) => task.id !== props.currentTaskId);
});

const canAddDependency = computed(() => {
  return !!props.currentTaskId && !!newDependency.value.predecessorId && !!newDependency.value.dependencyType;
});

const blockingInfo = computed(() => {
  if (!props.currentTaskId) return null;
  const predecessors = props.dependencies
    .filter((dep) => dep.successorTaskId === props.currentTaskId)
    .map((dep) => dep.predecessorTaskId);

  const blockingTasks = predecessors
    .map((id) => props.allTasks.find((task) => task.id === id))
    .filter((task): task is TaskForDAGViewModel => !!task)
    .filter((task) => task.status !== 'COMPLETED')
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status || 'PENDING',
      estimatedMinutes: task.estimatedMinutes || 0,
    }));

  if (blockingTasks.length === 0) return null;
  return {
    blockingTasks,
    totalPredecessors: predecessors.length,
  };
});

const dependencyTypeOptions = [
  { value: 'FS', label: 'FS - 完成到开始' },
  { value: 'SS', label: 'SS - 开始到开始' },
  { value: 'FF', label: 'FF - 完成到完成' },
  { value: 'SF', label: 'SF - 开始到完成' },
];

const pathExists = (start: string, target: string): boolean => {
  const visited = new Set<string>();
  const adjacency = new Map<string, string[]>();

  props.dependencies.forEach((dep) => {
    if (!adjacency.has(dep.predecessorTaskId)) {
      adjacency.set(dep.predecessorTaskId, []);
    }
    adjacency.get(dep.predecessorTaskId)?.push(dep.successorTaskId);
  });

  const dfs = (node: string): boolean => {
    if (node === target) return true;
    if (visited.has(node)) return false;
    visited.add(node);
    const nextNodes = adjacency.get(node) || [];
    return nextNodes.some((next) => dfs(next));
  };

  return dfs(start);
};

const handleAddDependency = () => {
  validationError.value = null;
  validationWarnings.value = [];

  if (!props.currentTaskId || !newDependency.value.predecessorId) return;

  const duplicate = props.dependencies.some(
    (dep) =>
      dep.predecessorTaskId === newDependency.value.predecessorId &&
      dep.successorTaskId === props.currentTaskId,
  );
  if (duplicate) {
    validationWarnings.value = [{ code: 'DUPLICATE', message: '该依赖关系已存在' }];
    return;
  }

  const hasCycle = pathExists(props.currentTaskId, newDependency.value.predecessorId);
  if (hasCycle) {
    validationError.value = {
      code: 'CIRCULAR_DEPENDENCY',
      message: '创建此依赖会形成循环依赖',
      details: {
        cyclePath: [newDependency.value.predecessorId, props.currentTaskId],
      },
    };
    showValidationDialog.value = true;
    return;
  }

  emit('dependency-added', {
    predecessorTaskId: newDependency.value.predecessorId,
    successorTaskId: props.currentTaskId,
    dependencyType: newDependency.value.dependencyType,
  });

  newDependency.value.predecessorId = '';
  newDependency.value.dependencyType = DependencyType.FINISH_TO_START;
};

const getTaskTitle = (id: string): string => {
  return props.allTasks.find((task) => task.id === id)?.title || `${id.slice(0, 8)}...`;
};

const getDependencyTypeColor = (type: string): string => {
  if (type === 'FS') return 'primary';
  if (type === 'SS') return 'info';
  if (type === 'FF') return 'success';
  if (type === 'SF') return 'warning';
  return 'default';
};

const getDependencyTypeIcon = (type: string): string => {
  if (type === 'FS') return 'mdi-arrow-right-bold';
  if (type === 'SS') return 'mdi-arrow-right';
  if (type === 'FF') return 'mdi-arrow-right-thick';
  if (type === 'SF') return 'mdi-arrow-right-bold-circle';
  return 'mdi-arrow-right';
};

const getDependencyTypeName = (type: string): string => {
  if (type === 'FS') return '完成到开始';
  if (type === 'SS') return '开始到开始';
  if (type === 'FF') return '完成到完成';
  if (type === 'SF') return '开始到完成';
  return type;
};
</script>
