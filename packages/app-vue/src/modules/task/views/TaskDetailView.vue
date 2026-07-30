<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8"
          :aria-label="t('common.back')"
          @click="router.back()"
        >
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" class="h-4" />
        <h1 class="text-lg font-medium text-foreground">
          {{ detailViewModel?.title || t('task.detail.title') }}
        </h1>
        <Badge v-if="detailViewModel" :variant="statusVariant">{{
          detailViewModel.statusText
        }}</Badge>
      </div>
      <div v-if="detailViewModel" class="flex items-center gap-2">
        <Button size="sm" @click="openEditDialog">
          <Pencil class="h-4 w-4 mr-1" />
          {{ t('task.detail.edit') }}
        </Button>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-6">
      <div v-if="isLoading" class="flex h-[50vh] items-center justify-center text-muted-foreground">
        {{ t('task.detail.loading') }}
      </div>

      <div
        v-else-if="!detailViewModel"
        class="flex h-[50vh] flex-col items-center justify-center text-muted-foreground"
      >
        <FileQuestion class="mb-4 h-12 w-12 opacity-50" />
        <p>{{ t('task.detail.notFound') }}</p>
      </div>

      <div v-else class="mx-auto max-w-4xl space-y-6">
        <!-- Info Card -->
        <Card>
          <CardHeader>
            <CardTitle>{{ t('task.detail.basicInfo') }}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-4 @2xl/panel:grid-cols-2">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.importance') }}
              </p>
              <p class="text-sm">{{ detailViewModel.importanceText }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.priority') }}
              </p>
              <p class="text-sm">{{ detailViewModel.priority }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.createTime') }}
              </p>
              <p class="text-sm">{{ formatTaskDate(currentTemplate?.createdAt) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.updateTime') }}
              </p>
              <p class="text-sm">{{ formatTaskDate(currentTemplate?.updatedAt) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.templateStartDate') }}
              </p>
              <p class="text-sm">{{ formatTaskDate(currentTemplate?.timeConfig?.startDate) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.timeType') }}
              </p>
              <p class="text-sm">{{ getTimeTypeLabel(currentTemplate?.timeConfig?.timeType) }}</p>
            </div>
            <div class="@2xl/panel:col-span-2">
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.timeValue') }}
              </p>
              <p class="text-sm">{{ getTimeValueLabel(detailViewModel.timeConfig) }}</p>
            </div>
            <div v-if="detailViewModel.description" class="@2xl/panel:col-span-2">
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.description') }}
              </p>
              <p class="text-sm">{{ detailViewModel.description }}</p>
            </div>
            <div class="@2xl/panel:col-span-2">
              <p class="mb-1 text-sm font-medium text-muted-foreground">
                {{ t('task.detail.tags') }}
              </p>
              <div v-if="detailViewModel.tags?.length" class="flex flex-wrap gap-1">
                <Badge v-for="tag in detailViewModel.tags" :key="tag" variant="secondary">{{
                  tag
                }}</Badge>
              </div>
              <p v-else class="text-sm">{{ t('task.templateCard.noTags') }}</p>
            </div>
          </CardContent>
        </Card>

        <Card
          v-if="detailViewModel.goalBinding"
          data-testid="task-goal-binding"
        >
          <CardHeader>
            <CardTitle>{{ t('task.detail.goalBinding') }}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-4 @2xl/panel:grid-cols-2">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.linkedGoal') }}
              </p>
              <p class="text-sm" data-testid="task-linked-goal-name">
                {{ detailViewModel.goalBinding.goalTitle ?? detailViewModel.goalBinding.goalId }}
              </p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.keyResult') }}
              </p>
              <p class="text-sm" data-testid="task-linked-key-result-name">
                {{
                  detailViewModel.goalBinding.keyResultTitle ??
                  detailViewModel.goalBinding.keyResultId
                }}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{{ t('task.detail.relations') }}</CardTitle>
          </CardHeader>
          <CardContent class="space-y-5">
            <div class="grid gap-4 @2xl/panel:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-muted-foreground">
                  {{ t('task.detail.parentTask') }}
                </p>
                <div v-if="parentTemplate" class="mt-2">
                  <Button variant="outline" size="sm" @click="handleOpenTaskDetail(parentTemplate.id)">
                    {{ parentTemplate.title }}
                  </Button>
                </div>
                <p v-else class="mt-2 text-sm">{{ t('task.detail.noParentTask') }}</p>
              </div>

              <div>
                <p class="text-sm font-medium text-muted-foreground">
                  {{ t('task.detail.dependencyStatus') }}
                </p>
                <div class="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {{ getDependencyStatusText(detailViewModel.dependencyStatus) }}
                  </Badge>
                  <Badge v-if="detailViewModel.isBlocked" variant="destructive">
                    {{ t('task.detail.blockedState') }}
                  </Badge>
                  <Badge v-else variant="secondary">
                    {{ t('task.detail.readyState') }}
                  </Badge>
                </div>
                <p v-if="detailViewModel.blockingReason" class="mt-2 text-sm text-muted-foreground">
                  {{ detailViewModel.blockingReason }}
                </p>
              </div>
            </div>

            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.subtasks') }}
              </p>
              <div v-if="childTemplates.length" class="mt-2 flex flex-wrap gap-2">
                <Button
                  v-for="child in childTemplates"
                  :key="child.id"
                  variant="outline"
                  size="sm"
                  @click="handleOpenTaskDetail(child.id)"
                >
                  {{ child.title }}
                </Button>
              </div>
              <p v-else class="mt-2 text-sm">{{ t('task.detail.noSubtasks') }}</p>
            </div>

            <div class="grid gap-4 @2xl/panel:grid-cols-2">
              <div>
                <p class="text-sm font-medium text-muted-foreground">
                  {{ t('task.detail.predecessors') }}
                </p>
                <div v-if="predecessorRelations.length" class="mt-2 space-y-2">
                  <div
                    v-for="relation in predecessorRelations"
                    :key="relation.dependency.id"
                    class="flex flex-wrap items-center gap-2 rounded-md border p-3"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      @click="handleOpenTaskDetail(relation.task.id)"
                    >
                      {{ relation.task.title }}
                    </Button>
                    <Badge variant="secondary">
                      {{ getDependencyTypeLabel(relation.dependency.dependencyType) }}
                    </Badge>
                  </div>
                </div>
                <p v-else class="mt-2 text-sm">{{ t('task.detail.noPredecessors') }}</p>
              </div>

              <div>
                <p class="text-sm font-medium text-muted-foreground">
                  {{ t('task.detail.successors') }}
                </p>
                <div v-if="successorRelations.length" class="mt-2 space-y-2">
                  <div
                    v-for="relation in successorRelations"
                    :key="relation.dependency.id"
                    class="flex flex-wrap items-center gap-2 rounded-md border p-3"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      @click="handleOpenTaskDetail(relation.task.id)"
                    >
                      {{ relation.task.title }}
                    </Button>
                    <Badge variant="secondary">
                      {{ getDependencyTypeLabel(relation.dependency.dependencyType) }}
                    </Badge>
                  </div>
                </div>
                <p v-else class="mt-2 text-sm">{{ t('task.detail.noSuccessors') }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Stats Card -->
        <Card>
          <CardHeader>
            <CardTitle>{{ t('task.detail.executionStats') }}</CardTitle>
          </CardHeader>
          <CardContent v-if="isRecurringPlan">
            <div
              v-if="(detailViewModel.dueInstanceCount ?? 0) > 0"
              class="grid gap-4 @2xl/panel:grid-cols-3"
              data-testid="task-detail-rolling-completion"
            >
              <div class="rounded-lg border p-4 text-center">
                <p class="text-2xl font-bold">{{ detailViewModel.dueInstanceCount ?? 0 }}</p>
                <p class="text-xs text-muted-foreground">
                  {{
                    t('task.detail.dueInWindow', {
                      days: detailViewModel.completionWindowDays ?? 30,
                    })
                  }}
                </p>
              </div>
              <div class="rounded-lg border p-4 text-center">
                <p class="text-2xl font-bold">
                  {{ detailViewModel.completedDueInstanceCount ?? 0 }}
                </p>
                <p class="text-xs text-muted-foreground">{{ t('task.detail.completedInWindow') }}</p>
              </div>
              <div class="rounded-lg border p-4 text-center">
                <p class="text-2xl font-bold">
                  {{ Math.round(detailViewModel.completionRate ?? 0) }}%
                </p>
                <p class="text-xs text-muted-foreground">{{ t('task.detail.completionRate') }}</p>
              </div>
            </div>
            <p
              v-else
              class="rounded-lg border p-4 text-sm text-muted-foreground"
              data-testid="task-detail-no-execution-records"
            >
              {{ t('task.detail.noExecutionRecords') }}
            </p>
          </CardContent>
          <CardContent v-else>
            <div
              class="flex items-center justify-between rounded-lg border p-4"
              data-testid="task-detail-one-time-status"
            >
              <p class="text-sm text-muted-foreground">{{ t('task.detail.oneTimeStatus') }}</p>
              <p class="text-base font-semibold text-primary">{{ oneTimeStatusText }}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- 编辑对话框 -->
    <TaskTemplateDialog
      v-if="editViewModel"
      v-model="showEditDialog"
      mode="edit"
      :template="editViewModel"
      :saving="isSaving"
      :available-templates="templateViewModels"
      :graph-tasks="graphData.nodes"
      :dependencies="dependencies"
      :on-create-dependency="handleCreateDependency"
      :on-delete-dependency="handleDeleteDependency"
      @save="handleSaveEdit"
      @cancel="showEditDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, FileQuestion, Pencil } from '@lucide/vue';
import {
  Button,
  Badge,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@memoflow/ui-vue-shadcn';
import { useTask } from '../composables/useTask';
import { useTaskGoalBindingOptions } from '../composables/useTaskGoalBindingOptions';
import TaskTemplateDialog from '../components/dialogs/TaskTemplateDialog.vue';
import type { TaskTemplateViewModel } from '../components/types';
import { DependencyType, TaskGoalBindingTrigger } from '@memoflow/contracts/task';
import type { TaskGraphDependencyDTO } from '@memoflow/contracts/task';
import {
  getTaskInstanceStatusLabel,
  getTaskTimeTypeLabel,
  getTaskTimeValueDisplay,
  mapTaskTemplateDtoToViewModel,
  toTaskTimeConfigPayload,
} from '../utils/task-template-presentation';
import type { GoalId, KeyResultId, TaskTemplateId } from '@memoflow/contracts/primitives';
import type { RecurrenceRuleDTO } from '@memoflow/contracts/task';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { buildTaskGraphData } from '../types/task-dag.types';
import { emptyKind, formatProductDate } from '../../../shared/utils/product-time';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const {
  templates,
  dependencies,
  currentTemplate,
  isLoading,
  isSaving,
  fetchTemplate,
  fetchTaskGraph,
  updateTemplate,
  createDependency,
  deleteDependency,
} = useTask();
const { loadGoalBinding, resolveGoalBinding } = useTaskGoalBindingOptions();

const showEditDialog = ref(false);
const templateViewModels = computed(() =>
  templates.value.map((template) => mapTaskTemplateDtoToViewModel(template, t)),
);
const graphData = computed(() => buildTaskGraphData(templates.value, dependencies.value));

const detailViewModel = computed<TaskTemplateViewModel | null>(() => {
  if (!currentTemplate.value) return null;
  const viewModel = mapTaskTemplateDtoToViewModel(currentTemplate.value, t);
  return {
    ...viewModel,
    goalBinding: resolveGoalBinding(viewModel.goalBinding),
  };
});

const parentTemplate = computed(() => {
  const parentTaskId = detailViewModel.value?.parentTaskId;
  if (!parentTaskId) {
    return null;
  }

  return templateViewModels.value.find((template) => template.id === parentTaskId) ?? null;
});

const childTemplates = computed(() => {
  const currentId = detailViewModel.value?.id;
  if (!currentId) {
    return [];
  }

  return templateViewModels.value
    .filter((template) => template.parentTaskId === currentId)
    .sort((a, b) => a.title.localeCompare(b.title));
});

const predecessorRelations = computed(() =>
  buildDependencyRelations('predecessorTaskId', 'successorTaskId'),
);

const successorRelations = computed(() =>
  buildDependencyRelations('successorTaskId', 'predecessorTaskId'),
);

const statusVariant = computed(() => {
  switch (detailViewModel.value?.status) {
    case 'ACTIVE':
      return 'default' as const;
    case 'PAUSED':
      return 'secondary' as const;
    case 'ARCHIVED':
      return 'outline' as const;
    default:
      return 'destructive' as const;
  }
});

const isRecurringPlan = computed(() => !!detailViewModel.value?.recurrenceRule);
const oneTimeStatusText = computed(() =>
  getTaskInstanceStatusLabel(t, detailViewModel.value?.singleInstanceStatus),
);

/** 将 store 中的 DTO 转换为 Dialog 所需的 ViewModel */
const editViewModel = computed<TaskTemplateViewModel | null>(() => {
  if (!detailViewModel.value) return null;
  return {
    ...detailViewModel.value,
    tags: [...(detailViewModel.value.tags ?? [])],
    timeConfig: { ...detailViewModel.value.timeConfig },
    goalBinding: detailViewModel.value.goalBinding
      ? { ...detailViewModel.value.goalBinding }
      : null,
  };
});

function openEditDialog() {
  showEditDialog.value = true;
}

function toGoalBindingPayload(goalBinding: TaskTemplateViewModel['goalBinding']) {
  if (!goalBinding?.goalId || !goalBinding?.keyResultId) {
    return goalBinding === null ? null : undefined;
  }

  return {
    goalId: goalBinding.goalId as GoalId,
    keyResultId: goalBinding.keyResultId as KeyResultId,
    goalRecordValue: goalBinding.incrementValue ?? 1,
    progressTrigger: goalBinding.progressTrigger ?? TaskGoalBindingTrigger.PerInstance,
  };
}

async function handleSaveEdit(vm: TaskTemplateViewModel) {
  const id = route.params.id as string;
  const result = await updateTemplate(id, {
    name: vm.title,
    description: vm.description ?? null,
    timeConfig: toTaskTimeConfigPayload(vm.timeConfig),
    recurrenceRule: (vm.recurrenceRule as unknown as RecurrenceRuleDTO) ?? null,
    importance: (vm.importance as ImportanceLevel) ?? 'Moderate',
    parentTaskId: (vm.parentTaskId as TaskTemplateId) ?? null,
    tags: vm.tags ?? [],
    color: vm.color ?? null,
    goalBinding: toGoalBindingPayload(vm.goalBinding),
  });
  if (result) {
    showEditDialog.value = false;
    await Promise.all([fetchTemplate(id), fetchTaskGraph({ page: 1, limit: 1000 })]);
  }
}

async function handleCreateDependency(dependency: {
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: DependencyType;
}): Promise<boolean> {
  const result = await createDependency(dependency);
  if (!result) {
    return false;
  }

  await fetchTaskGraph({ page: 1, limit: 1000 });
  return true;
}

async function handleDeleteDependency(dependencyId: string): Promise<boolean> {
  const deleted = await deleteDependency(dependencyId);
  if (!deleted) {
    return false;
  }

  await fetchTaskGraph({ page: 1, limit: 1000 });
  return true;
}

function buildDependencyRelations(
  taskKey: 'predecessorTaskId' | 'successorTaskId',
  currentKey: 'predecessorTaskId' | 'successorTaskId',
) {
  const currentId = detailViewModel.value?.id;
  if (!currentId) {
    return [] as Array<{ dependency: TaskGraphDependencyDTO; task: TaskTemplateViewModel }>;
  }

  return dependencies.value
    .filter((dependency) => dependency[currentKey] === currentId)
    .map((dependency) => {
      const relatedTask = templateViewModels.value.find(
        (template) => template.id === dependency[taskKey],
      );
      return relatedTask ? { dependency, task: relatedTask } : null;
    })
    .filter((relation): relation is { dependency: TaskGraphDependencyDTO; task: TaskTemplateViewModel } => !!relation)
    .sort((a, b) => a.task.title.localeCompare(b.task.title));
}

function getDependencyTypeLabel(type: string): string {
  if (type === DependencyType.FinishToStart) return t('task.dependency.fsLabel');
  if (type === DependencyType.StartToStart) return t('task.dependency.ssLabel');
  if (type === DependencyType.FinishToFinish) return t('task.dependency.ffLabel');
  if (type === DependencyType.StartToFinish) return t('task.dependency.sfLabel');
  return type;
}

function getDependencyStatusText(status?: string): string {
  if (!status) {
    return t('common.none');
  }

  if (status === 'Blocked') {
    return t('task.detail.blockedState');
  }

  if (status === 'Ready') {
    return t('task.detail.readyState');
  }

  return status;
}

function handleOpenTaskDetail(id: string) {
  if (id === detailViewModel.value?.id) {
    return;
  }

  router.push({ name: 'task-detail', params: { id } });
}

function formatTaskDate(ts?: number | null): string {
  return formatProductDate(ts, emptyKind('dash'));
}

function getTimeTypeLabel(type?: string | null): string {
  return getTaskTimeTypeLabel(t, type);
}

function getTimeValueLabel(timeConfig?: TaskTemplateViewModel['timeConfig'] | null): string {
  return getTaskTimeValueDisplay(t, timeConfig);
}

async function loadDetailPage(id: string) {
  if (!id || id === 'new') {
    return;
  }

  await Promise.all([fetchTemplate(id), fetchTaskGraph({ page: 1, limit: 1000 })]);

  const goalId = currentTemplate.value?.goalBinding?.goalId;
  if (goalId) {
    await loadGoalBinding(goalId);
  }
}

watch(
  () => route.params.id,
  async (id) => {
    if (typeof id === 'string') {
      await loadDetailPage(id);
    }
  },
);

onMounted(async () => {
  const id = route.params.id as string;
  await loadDetailPage(id);
});
</script>
