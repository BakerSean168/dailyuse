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
        :dependencies="[]"
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
import { TaskGoalBindingTrigger, TaskType } from '@dailyuse/contracts/task';
import { mapTaskTemplateDtoToViewModel } from '../utils/taskTemplatePresentation';
import type { GoalId, KeyResultId } from '@dailyuse/contracts/primitives';

const router = useRouter();
const { t } = useI18n();
const {
  templates,
  isLoading,
  isSaving,
  fetchTemplates,
  fetchTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  activateTemplate,
  pauseTemplate,
} = useTask();

const searchQuery = ref('');
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editViewModel = ref<TaskTemplateViewModel | null>(null);

const viewModels = computed(() =>
  templates.value.map((dto) => mapTaskTemplateDtoToViewModel(dto, t)),
);

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
    tags: template.tags ?? [],
    color: template.color ?? null,
    goalBinding: toGoalBindingPayload(template),
  });
  if (result) {
    showCreateDialog.value = false;
    toast.success(t('task.management.createSuccess'));
    await fetchTemplates();
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
    tags: vm.tags ?? [],
    color: vm.color ?? null,
    goalBinding: toGoalBindingPayload(vm),
  });
  if (result) {
    showEditDialog.value = false;
    editViewModel.value = null;
    toast.success(t('task.management.editSuccess'));
    await fetchTemplates();
  }
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
  await deleteTemplate(template.id);
}

async function handleResume(template: TaskTemplateViewModel) {
  await activateTemplate(template.id);
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

  await pauseTemplate(template.id);
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
  toast.success(t('task.management.allDeleted'));
}

onMounted(async () => {
  await fetchTemplates();
});
</script>
