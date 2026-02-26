<template>
  <Card class="dependency-manager">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Link2 class="h-5 w-5" />
        管理任务依赖
      </CardTitle>
    </CardHeader>

    <CardContent>
      <div v-if="currentDependencies.length > 0" class="mb-4">
        <div class="text-sm font-medium mb-2">当前依赖 ({{ currentDependencies.length }})</div>
        <div class="divide-y">
          <div
            v-for="dep in currentDependencies"
            :key="dep.id"
            class="flex items-center gap-2 py-2"
          >
            <component
              :is="getDependencyTypeIconComponent(dep.dependencyType)"
              class="h-4 w-4 shrink-0"
              :class="getDependencyTypeColorClass(dep.dependencyType)"
            />
            <div class="flex-1 min-w-0">
              <div class="text-sm">
                {{ getTaskTitle(dep.predecessorTaskId) }}
                <ArrowRight class="inline h-3 w-3 mx-1" />
                {{ getTaskTitle(dep.successorTaskId) }}
              </div>
              <div class="text-xs text-muted-foreground">
                {{ getDependencyTypeName(dep.dependencyType) }}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              class="h-7 w-7"
              @click="emit('dependency-deleted', dep.id)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Separator class="my-4" />
      <div class="text-sm font-medium mb-3">添加新依赖</div>

      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 md:col-span-5">
          <Label class="mb-1.5 block">前置任务</Label>
          <Select v-model="newDependency.predecessorId" :disabled="!currentTaskId">
            <SelectTrigger>
              <SelectValue placeholder="选择前置任务" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="task in availablePredecessors" :key="task.id" :value="task.id">
                {{ task.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="col-span-12 md:col-span-3">
          <Label class="mb-1.5 block">依赖类型</Label>
          <Select v-model="newDependency.dependencyType">
            <SelectTrigger>
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="opt in dependencyTypeOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="col-span-12 md:col-span-4 flex items-end">
          <Button :disabled="!canAddDependency" @click="handleAddDependency">
            <Plus class="h-4 w-4 mr-1" />
            添加依赖
          </Button>
        </div>
      </div>

      <Alert v-if="validationWarnings.length > 0" variant="destructive" class="mt-3">
        <AlertTriangle class="h-4 w-4" />
        <AlertDescription>
          <ul class="pl-4 mb-0 list-disc">
            <li v-for="(warning, index) in validationWarnings" :key="index">
              {{ warning.message }}
            </li>
          </ul>
        </AlertDescription>
      </Alert>

      <BlockedTaskInfo
        v-if="currentTaskId && blockingInfo"
        :blocking-tasks="blockingInfo.blockingTasks"
        :total-predecessors="blockingInfo.totalPredecessors"
        class="mt-4"
      />
    </CardContent>

    <DependencyValidationDialog
      v-model="showValidationDialog"
      :error="validationError"
      :tasks="allTasks"
      @view-graph="emit('view-graph')"
    />
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DependencyType, type TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Separator,
  Alert,
  AlertDescription,
  Label,
} from '@dailyuse/ui-vue-shadcn';
import { Link2, ArrowRight, ArrowRightLeft, Trash2, Plus, AlertTriangle } from 'lucide-vue-next';
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
  (
    e: 'dependency-added',
    dependency: { predecessorTaskId: string; successorTaskId: string; dependencyType: string },
  ): void;
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
  return (
    !!props.currentTaskId &&
    !!newDependency.value.predecessorId &&
    !!newDependency.value.dependencyType
  );
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

const getDependencyTypeColorClass = (type: string): string => {
  if (type === 'FS') return 'text-primary';
  if (type === 'SS') return 'text-blue-500';
  if (type === 'FF') return 'text-green-500';
  if (type === 'SF') return 'text-yellow-500';
  return 'text-muted-foreground';
};

const getDependencyTypeIconComponent = (type: string) => {
  // All dependency types use ArrowRight variants
  if (type === 'SF') return ArrowRightLeft;
  return ArrowRight;
};

const getDependencyTypeName = (type: string): string => {
  if (type === 'FS') return '完成到开始';
  if (type === 'SS') return '开始到开始';
  if (type === 'FF') return '完成到完成';
  if (type === 'SF') return '开始到完成';
  return type;
};
</script>
