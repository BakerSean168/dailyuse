<template>
  <v-card class="dependency-manager">
    <v-card-title>
      <v-icon class="mr-2">mdi-link-variant</v-icon>
      管理任务依赖
    </v-card-title>

    <v-card-text>
      <!-- 当前依赖列表 -->
      <div v-if="currentDependencies.length > 0" class="mb-4">
        <div class="text-subtitle-2 mb-2">当前依赖 ({{ currentDependencies.length }})</div>
        <v-list density="compact">
          <v-list-item v-for="dep in currentDependencies" :key="dep.uuid" class="px-0">
            <template #prepend>
              <v-icon :color="getDependencyTypeColor(dep.dependencyType)" size="small">
                {{ getDependencyTypeIcon(dep.dependencyType) }}
              </v-icon>
            </template>

            <v-list-item-title>
              {{ getTaskTitle(dep.predecessorTaskUuid) }}
              <v-icon size="x-small" class="mx-1">mdi-arrow-right</v-icon>
              {{ getTaskTitle(dep.successorTaskUuid) }}
            </v-list-item-title>

            <v-list-item-subtitle>
              {{ getDependencyTypeName(dep.dependencyType) }}
            </v-list-item-subtitle>

            <template #append>
              <v-btn
                icon="mdi-delete"
                size="x-small"
                variant="text"
                @click="handleDeleteDependency(dep)"
              />
            </template>
          </v-list-item>
        </v-list>
      </div>

      <!-- 添加新依赖 -->
      <v-divider class="my-4" />

      <div class="text-subtitle-2 mb-3">添加新依赖</div>

      <v-row>
        <v-col cols="12" md="5">
          <v-select
            v-model="newDependency.predecessorUuid"
            :items="availablePredecessors"
            item-title="title"
            item-value="uuid"
            label="前置任务"
            density="compact"
            :disabled="!currentTaskUuid"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :color="getStatusColor(item.raw.status)" size="small">
                    mdi-checkbox-marked-circle
                  </v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="3">
          <v-select
            v-model="newDependency.dependencyType"
            :items="dependencyTypeOptions"
            item-title="label"
            item-value="value"
            label="依赖类型"
            density="compact"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :color="item.raw.color" size="small">
                    {{ item.raw.icon }}
                  </v-icon>
                </template>
                <v-list-item-subtitle>
                  {{ item.raw.description }}
                </v-list-item-subtitle>
              </v-list-item>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" md="4" class="d-flex align-center">
          <v-btn
            color="primary"
            :disabled="!canAddDependency"
            :loading="isValidating"
            @click="handleAddDependency"
          >
            <v-icon start>mdi-plus</v-icon>
            添加依赖
          </v-btn>
        </v-col>
      </v-row>

      <!-- 验证警告 -->
      <v-alert v-if="validationWarnings.length > 0" type="warning" density="compact" class="mt-3">
        <div class="text-subtitle-2 mb-1">⚠️ 验证警告</div>
        <ul class="pl-4 mb-0">
          <li v-for="(warning, index) in validationWarnings" :key="index">
            {{ warning.message }}
          </li>
        </ul>
      </v-alert>

      <!-- 阻塞信息 -->
      <BlockedTaskInfo
        v-if="currentTaskUuid && blockingInfo"
        :blocking-tasks="blockingInfo.blockingTasks"
        :total-predecessors="blockingInfo.totalPredecessors"
        class="mt-4"
      />
    </v-card-text>

    <!-- 验证错误对话框 -->
    <DependencyValidationDialog
      v-model="showValidationDialog"
      :error="validationError"
      :tasks="allTasks"
      @view-graph="$emit('view-graph')"
    />
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { DependencyType } from '@dailyuse/contracts/task';
import type { TaskDependencyClientDTO } from '@dailyuse/contracts/task';
import type { TaskForDAG } from '@/modules/task/types/task-dag.types';
import { taskDependencyValidationService } from '@/modules/task/application/services/TaskDependencyValidationService';
import { taskAutoStatusService } from '@/modules/task/application/services/TaskAutoStatusService';
import type {
  ValidationError,
  ValidationWarning,
} from '@/modules/task/application/services/TaskDependencyValidationService';
import DependencyValidationDialog from './DependencyValidationDialog.vue';
import BlockedTaskInfo from './BlockedTaskInfo.vue';
import { getTaskDependencyApiClient } from '@dailyuse/infrastructure-client';
import { useAuthentication } from '@/modules/authentication/presentation/composables/useAuthentication';

const taskDependencyApiClient = getTaskDependencyApiClient();

const { user } = useAuthentication();

interface Props {
  currentTaskUuid?: string;
  allTasks: TaskForDAG[];
  dependencies: TaskDependencyClientDTO[];
}

interface Emits {
  (e: 'dependency-added', dependency: TaskDependencyClientDTO): void;
  (e: 'dependency-deleted', dependencyUuid: string): void;
  (e: 'view-graph'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// State
const newDependency = ref({
  predecessorUuid: '',
  dependencyType: DependencyType.FINISH_TO_START,
});

const isValidating = ref(false);
const validationError = ref<ValidationError | null>(null);
const validationWarnings = ref<ValidationWarning[]>([]);
const showValidationDialog = ref(false);

// Computed
const currentDependencies = computed(() => {
  if (!props.currentTaskUuid) return [];
  return props.dependencies.filter((dep) => dep.successorTaskUuid === props.currentTaskUuid);
});

const availablePredecessors = computed(() => {
  if (!props.currentTaskUuid) return [];

  // 排除当前任务自己
  return props.allTasks.filter((task) => task.uuid !== props.currentTaskUuid);
});

const canAddDependency = computed(() => {
  return (
    props.currentTaskUuid &&
    newDependency.value.predecessorUuid &&
    newDependency.value.dependencyType &&
    !isValidating.value
  );
});

const blockingInfo = computed(() => {
  if (!props.currentTaskUuid) return null;

  const currentTask = props.allTasks.find((t) => t.uuid === props.currentTaskUuid);
  if (!currentTask) return null;

  const readiness = taskAutoStatusService.analyzeTaskReadiness(
    currentTask,
    props.allTasks,
    props.dependencies,
  );

  if (readiness.incompletePredecessors.length === 0) return null;

  return {
    blockingTasks: readiness.incompletePredecessors.map((uuid) => {
      const task = props.allTasks.find((t) => t.uuid === uuid);
      return {
        uuid,
        title: task?.title || 'Unknown',
        status: task?.status || 'UNKNOWN',
        estimatedMinutes: task?.estimatedMinutes,
      };
    }),
    totalPredecessors: readiness.totalPredecessors,
  };
});

// Dependency type options
const dependencyTypeOptions = [
  {
    value: 'FS',
    label: 'FS - 完成到开始',
    description: '前置任务完成后，后续任务才能开始',
    icon: 'mdi-arrow-right-bold',
    color: 'primary',
  },
  {
    value: 'SS',
    label: 'SS - 开始到开始',
    description: '前置任务开始后，后续任务才能开始',
    icon: 'mdi-arrow-right',
    color: 'info',
  },
  {
    value: 'FF',
    label: 'FF - 完成到完成',
    description: '前置任务完成后，后续任务才能完成',
    icon: 'mdi-arrow-right-thick',
    color: 'success',
  },
  {
    value: 'SF',
    label: 'SF - 开始到完成',
    description: '前置任务开始后，后续任务才能完成',
    icon: 'mdi-arrow-right-bold-circle',
    color: 'warning',
  },
];

// Methods
const handleAddDependency = async () => {
  if (!props.currentTaskUuid || !newDependency.value.predecessorUuid) return;

  isValidating.value = true;
  validationError.value = null;
  validationWarnings.value = [];

  try {
    // 1. 验证依赖
    const validationResult = await taskDependencyValidationService.validateDependency(
      newDependency.value.predecessorUuid,
      props.currentTaskUuid,
      newDependency.value.dependencyType,
      props.dependencies,
      props.allTasks,
    );

    // 2. 处理验证结果
    if (!validationResult.isValid) {
      validationError.value = validationResult.errors[0];
      showValidationDialog.value = true;
      return;
    }

    // 显示警告（如果有）
    if (validationResult.warnings.length > 0) {
      validationWarnings.value = validationResult.warnings;
    }

    // 3. 创建依赖
    const newDep = await taskDependencyApiClient.createDependency(props.currentTaskUuid, {
      accountUuid: user.value?.uuid || '',
      predecessorTaskUuid: newDependency.value.predecessorUuid,
      successorTaskUuid: props.currentTaskUuid!,
      dependencyType: newDependency.value.dependencyType,
    });

    // 4. 触发状态级联更新
    await taskAutoStatusService.updateTaskStatusOnDependencyChange(
      props.currentTaskUuid,
      props.allTasks,
      [...props.dependencies, newDep],
    );

    // 5. 通知父组件
    emit('dependency-added', newDep);

    // 6. 重置表单
    newDependency.value.predecessorUuid = '';
    newDependency.value.dependencyType = DependencyType.FINISH_TO_START;
  } catch (error) {
    console.error('Failed to add dependency:', error);
    validationError.value = {
      code: 'API_ERROR',
      message: '创建依赖失败，请稍后重试',
    };
    showValidationDialog.value = true;
  } finally {
    isValidating.value = false;
  }
};

const handleDeleteDependency = async (dep: TaskDependencyClientDTO) => {
  try {
    await taskDependencyApiClient.deleteDependency(dep.uuid);

    // 触发状态级联更新
    if (props.currentTaskUuid) {
      const remainingDeps = props.dependencies.filter((d) => d.uuid !== dep.uuid);
      await taskAutoStatusService.updateTaskStatusOnDependencyChange(
        props.currentTaskUuid,
        props.allTasks,
        remainingDeps,
      );
    }

    emit('dependency-deleted', dep.uuid);
  } catch (error) {
    console.error('Failed to delete dependency:', error);
  }
};

const getTaskTitle = (uuid: string): string => {
  const task = props.allTasks.find((t) => t.uuid === uuid);
  return task?.title || uuid.substring(0, 8) + '...';
};

const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    COMPLETED: 'success',
    IN_PROGRESS: 'primary',
    READY: 'info',
    BLOCKED: 'error',
    PENDING: 'grey',
  };
  return colors[status] || 'grey';
};

const getDependencyTypeColor = (type: string): string => {
  const option = dependencyTypeOptions.find((opt) => opt.value === type);
  return option?.color || 'default';
};

const getDependencyTypeIcon = (type: string): string => {
  const option = dependencyTypeOptions.find((opt) => opt.value === type);
  return option?.icon || 'mdi-arrow-right';
};

const getDependencyTypeName = (type: string): string => {
  const option = dependencyTypeOptions.find((opt) => opt.value === type);
  return option?.label || type;
};

// Watch for warnings timeout
watch(validationWarnings, (newWarnings) => {
  if (newWarnings.length > 0) {
    // Auto-clear warnings after 10 seconds
    setTimeout(() => {
      validationWarnings.value = [];
    }, 10000);
  }
});
</script>

<style scoped>
.dependency-manager {
  max-width: 800px;
}
</style>

