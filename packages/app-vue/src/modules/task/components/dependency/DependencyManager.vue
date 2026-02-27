<template>
  <Card class="dependency-manager">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <Link2 class="h-5 w-5" />
        {{ t('task.dependency.title') }}
      </CardTitle>
    </CardHeader>

    <CardContent>
      <div v-if="currentDependencies.length > 0" class="mb-4">
        <div class="text-sm font-medium mb-2">
          {{ t('task.dependency.currentDeps') }} ({{ currentDependencies.length }})
        </div>
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
      <div class="text-sm font-medium mb-3">{{ t('task.dependency.addNew') }}</div>

      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12 md:col-span-5">
          <Label class="mb-1.5 block">{{ t('task.dependency.sourceTask') }}</Label>
          <Select v-model="newDependency.predecessorId" :disabled="!currentTaskId">
            <SelectTrigger>
              <SelectValue :placeholder="t('task.dependency.selectSource')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="task in availablePredecessors" :key="task.id" :value="task.id">
                {{ task.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="col-span-12 md:col-span-3">
          <Label class="mb-1.5 block">{{ t('task.dependency.depType') }}</Label>
          <Select v-model="newDependency.dependencyType">
            <SelectTrigger>
              <SelectValue :placeholder="t('task.dependency.selectType')" />
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
            {{ t('task.dependency.add') }}
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
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();

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

const dependencyTypeOptions = computed(() => [
  { value: 'FS', label: t('task.dependency.fs') },
  { value: 'SS', label: t('task.dependency.ss') },
  { value: 'FF', label: t('task.dependency.ff') },
  { value: 'SF', label: t('task.dependency.sf') },
]);

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
    validationWarnings.value = [{ code: 'DUPLICATE', message: t('task.dependency.alreadyExists') }];
    return;
  }

  const hasCycle = pathExists(props.currentTaskId, newDependency.value.predecessorId);
  if (hasCycle) {
    validationError.value = {
      code: 'CIRCULAR_DEPENDENCY',
      message: t('task.dependency.cyclicError'),
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
  if (type === 'FS') return t('task.dependency.fsLabel');
  if (type === 'SS') return t('task.dependency.ssLabel');
  if (type === 'FF') return t('task.dependency.ffLabel');
  if (type === 'SF') return t('task.dependency.sfLabel');
  return type;
};
</script>
