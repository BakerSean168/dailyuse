<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-medium text-foreground">{{ t('task.management.title') }}</h1>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative hidden w-64 lg:block">
          <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            :placeholder="t('task.management.searchPlaceholder')"
            class="h-8 w-full border-transparent bg-secondary/50 pl-8 focus-visible:border-ring focus-visible:bg-background"
          />
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      <div v-if="isLoading" class="flex h-[50vh] items-center justify-center text-muted-foreground">
        {{ t('task.management.loading') }}
      </div>

      <TaskTemplateManagement
        v-else
        :templates="filteredViewModels"
        :graph-data="graphData"
        :on-create-dependency="handleCreateDependency"
        @create-template="handleCreate"
        @click-template="handleClickTemplate"
        @edit-template="handleEdit"
        @delete-template="handleDelete"
        @pause-template="handlePause"
        @resume-template="handleResume"
        @delete-all-templates="handleDeleteAll"
      />
    </div>

    <!-- 创建模板对话框 -->
    <TaskTemplateDialog
      v-model="showCreateDialog"
      mode="create"
      :saving="isSaving"
      :available-templates="viewModels"
      :graph-tasks="graphData.nodes"
      @save="handleSaveCreate"
      @cancel="showCreateDialog = false"
    />

    <!-- 编辑模板对话框 -->
    <TaskTemplateDialog
      v-if="editViewModel"
      v-model="showEditDialog"
      mode="edit"
      :template="editViewModel"
      :saving="isSaving"
      :available-templates="viewModels"
      :graph-tasks="graphData.nodes"
      :dependencies="dependencies"
      :on-create-dependency="handleCreateDependencyFromDialog"
      :on-delete-dependency="handleDeleteDependency"
      @save="handleSaveEdit"
      @cancel="showEditDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { useI18n } from 'vue-i18n';
import { Search } from 'lucide-vue-next';
import { Input, useConfirm } from '@dailyuse/ui-vue-shadcn';
import TaskTemplateManagement from '../components/TaskTemplateManagement.vue';
import TaskTemplateDialog from '../components/dialogs/TaskTemplateDialog.vue';
import { useTask } from '../composables/useTask';
import type { TaskTemplateViewModel } from '../components/types';
import { DependencyType, TaskGoalBindingTrigger, TaskType } from '@dailyuse/contracts/task';
import type { DependencyType as DependencyTypeValue } from '@dailyuse/contracts/task';
import type { TaskTemplateId } from '@dailyuse/contracts/primitives';
import { mapTaskTemplateDtoToViewModel } from '../utils/taskTemplatePresentation';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/primitives';
import { buildTaskGraphData } from '../types/task-dag.types';

const router = useRouter();
const { t } = useI18n();
const {
  templates,
  dependencies,
  isLoading,
  isSaving,
  fetchTaskGraph,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  activateTemplate,
  pauseTemplate,
  createDependency,
  deleteDependency,
} = useTask();

const searchQuery = ref('');
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editViewModel = ref<TaskTemplateViewModel | null>(null);

const viewModels = computed(() => {
  const baseViewModels = templates.value.map((dto) => mapTaskTemplateDtoToViewModel(dto, t));
  const templateById = new Map(baseViewModels.map((template) => [template.id, template]));
  const predecessorCounts = new Map<string, number>();
  const successorCounts = new Map<string, number>();
  const childCounts = new Map<string, number>();

  baseViewModels.forEach((template) => {
    predecessorCounts.set(template.id, 0);
    successorCounts.set(template.id, 0);
    childCounts.set(template.id, 0);
  });

  dependencies.value.forEach((dependency) => {
    predecessorCounts.set(
      dependency.successorTaskId,
      (predecessorCounts.get(dependency.successorTaskId) ?? 0) + 1,
    );
    successorCounts.set(
      dependency.predecessorTaskId,
      (successorCounts.get(dependency.predecessorTaskId) ?? 0) + 1,
    );
  });

  baseViewModels.forEach((template) => {
    if (!template.parentTaskId) {
      return;
    }

    childCounts.set(template.parentTaskId, (childCounts.get(template.parentTaskId) ?? 0) + 1);
  });

  return baseViewModels.map((template) => ({
    ...template,
    parentTaskTitle: template.parentTaskId
      ? templateById.get(template.parentTaskId)?.title ?? null
      : null,
    predecessorCount: predecessorCounts.get(template.id) ?? 0,
    successorCount: successorCounts.get(template.id) ?? 0,
    childCount: childCounts.get(template.id) ?? 0,
  }));
});
const graphData = computed(() => buildTaskGraphData(templates.value, dependencies.value));

const filteredViewModels = computed(() => {
  if (!searchQuery.value.trim()) return viewModels.value;
  const q = searchQuery.value.toLowerCase();
  return viewModels.value.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q)),
  );
});

async function refreshTaskManagement() {
  await fetchTaskGraph({ page: 1, limit: 1000 });
}

function toGoalBindingPayload(template: TaskTemplateViewModel) {
  if (!template.goalBinding?.goalId || !template.goalBinding?.keyResultId) {
    return null;
  }

  return {
    goalId: template.goalBinding.goalId as GoalId,
    keyResultId: template.goalBinding.keyResultId as KeyResultId,
    goalRecordValue: template.goalBinding.incrementValue ?? 1,
    progressTrigger: template.goalBinding.progressTrigger ?? TaskGoalBindingTrigger.PerInstance,
  };
}

function handleCreate() {
  showCreateDialog.value = true;
}

async function handleSaveCreate(template: TaskTemplateViewModel) {
  const result = await createTemplate({
    name: template.title,
    description: template.description ?? null,
    taskType: template.recurrenceRule ? TaskType.Recurring : TaskType.OneTime,
    timeConfig: template.timeConfig as any,
    recurrenceRule: template.recurrenceRule ?? null,
    importance: (template.importance as any) ?? 'Moderate',
    parentTaskId: (template.parentTaskId as TaskTemplateId) ?? null,
    tags: template.tags ?? [],
    color: template.color ?? null,
    goalBinding: toGoalBindingPayload(template),
  });
  if (result) {
    showCreateDialog.value = false;
    toast.success(t('task.management.createSuccess'));
    await refreshTaskManagement();
  }
}

function handleClickTemplate(templateId: string) {
  router.push({ name: 'task-detail', params: { id: templateId } });
}

function handleEdit(templateId: string) {
  const vm = viewModels.value.find((v) => v.id === templateId);
  if (vm) {
    editViewModel.value = { ...vm };
    showEditDialog.value = true;
  }
}

async function handleSaveEdit(vm: TaskTemplateViewModel) {
  const result = await updateTemplate(vm.id, {
    name: vm.title,
    description: vm.description ?? null,
    timeConfig: vm.timeConfig as any,
    recurrenceRule: vm.recurrenceRule ?? null,
    importance: (vm.importance as any) ?? 'Moderate',
    parentTaskId: (vm.parentTaskId as TaskTemplateId) ?? null,
    tags: vm.tags ?? [],
    color: vm.color ?? null,
    goalBinding: toGoalBindingPayload(vm),
  });
  if (result) {
    showEditDialog.value = false;
    editViewModel.value = null;
    toast.success(t('task.management.editSuccess'));
    await refreshTaskManagement();
  }
}

async function handleCreateDependency(
  predecessorTaskId: string,
  successorTaskId: string,
): Promise<boolean> {
  const result = await createDependency({
    predecessorTaskId,
    successorTaskId,
    dependencyType: DependencyType.FinishToStart,
  });

  if (!result) {
    return false;
  }

  await refreshTaskManagement();
  return true;
}

async function handleCreateDependencyFromDialog(dependency: {
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: DependencyTypeValue;
}): Promise<boolean> {
  const result = await createDependency(dependency);
  if (!result) {
    return false;
  }

  await refreshTaskManagement();
  return true;
}

async function handleDeleteDependency(dependencyId: string): Promise<boolean> {
  const deleted = await deleteDependency(dependencyId);
  if (!deleted) {
    return false;
  }

  await refreshTaskManagement();
  return true;
}

async function handleDelete(template: TaskTemplateViewModel) {
  const confirmed = await useConfirm({
    title: t('task.management.deleteTemplate'),
    description: t('task.management.confirmDelete', { name: template.title }),
    confirmText: t('common.confirm'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });

  if (!confirmed) return;
  const deleted = await deleteTemplate(template.id);
  if (deleted) {
    await refreshTaskManagement();
  }
}

async function handleResume(template: TaskTemplateViewModel) {
  const result = await activateTemplate(template.id);
  if (result) {
    await refreshTaskManagement();
  }
}

async function handlePause(template: TaskTemplateViewModel) {
  const confirmed = await useConfirm({
    title: t('task.management.pauseTitle'),
    description: t('task.management.pauseDescription', { name: template.title }),
    confirmText: t('task.templateCard.pause'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });

  if (!confirmed) return;

  const result = await pauseTemplate(template.id);
  if (result) {
    await refreshTaskManagement();
  }
}

async function handleDeleteAll() {
  const confirmed = await useConfirm({
    title: t('task.templateMgmt.confirmDeleteAll'),
    description: t('task.management.confirmDeleteAll'),
    confirmText: t('common.confirm'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });

  if (!confirmed) return;

  for (const t_ of templates.value) {
    await deleteTemplate(t_.id);
  }
  await refreshTaskManagement();
  toast.success(t('task.management.allDeleted'));
}

onMounted(async () => {
  await refreshTaskManagement();
});
</script>
