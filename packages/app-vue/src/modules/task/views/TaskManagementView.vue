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
import { Input } from '@dailyuse/ui-vue-shadcn';
import TaskTemplateManagement from '../components/TaskTemplateManagement.vue';
import TaskTemplateDialog from '../components/dialogs/TaskTemplateDialog.vue';
import { useTask } from '../composables/useTask';
import type { TaskTemplateViewModel } from '../components/types';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

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
} = useTask();

const searchQuery = ref('');
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editViewModel = ref<TaskTemplateViewModel | null>(null);

const timeTypeMap: Record<string, TaskTemplateViewModel['timeConfig']['timeType']> = {
  AllDay: 'AllDay',
  TimePoint: 'TimePoint',
  TimeRange: 'TimeRange',
};

const statusMap: Record<string, string> = {
  Active: 'ACTIVE',
  Paused: 'PAUSED',
  Archived: 'ARCHIVED',
  Deleted: 'DELETED',
};

function mapToViewModel(dto: TaskTemplateClientDTO): TaskTemplateViewModel {
  const status = statusMap[dto.status] ?? dto.status;
  return {
    id: dto.id,
    title: dto.name,
    description: dto.description ?? undefined,
    status,
    isActive: status === 'ACTIVE',
    isPaused: status === 'PAUSED',
    isArchived: status === 'ARCHIVED',
    priority: dto.priority,
    tags: dto.tags,
    goalBinding: dto.goalBinding
      ? {
          goalId: dto.goalBinding.goalId,
          keyResultId: dto.goalBinding.keyResultId,
          incrementValue: dto.goalBinding.goalRecordValue,
        }
      : null,
    timeConfig: {
      timeType:
        timeTypeMap[dto.timeConfig?.timeType] ??
        (dto.timeConfig?.timeType as TaskTemplateViewModel['timeConfig']['timeType']),
      timePoint: dto.timeConfig?.timePoint ?? undefined,
      timeRange: dto.timeConfig?.timeRange ?? undefined,
      startDate: dto.startDate ?? undefined,
    },
    recurrenceRule: dto.recurrenceRule ?? null,
    reminderConfig: dto.reminderConfig ?? null,
    instanceCount: dto.instanceCount,
    completionRate: dto.completionRate,
    formattedCreatedAt: dto.createdAt ? new Date(dto.createdAt).toLocaleDateString() : undefined,
  };
}

const viewModels = computed(() => templates.value.map(mapToViewModel));

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

function handleCreate() {
  showCreateDialog.value = true;
}

async function handleSaveCreate(template: TaskTemplateViewModel) {
  const result = await createTemplate({
    name: template.title,
    description: template.description ?? null,
    taskType:
      (template.taskType as 'ONE_TIME' | 'RECURRING') ??
      (template.recurrenceRule ? 'RECURRING' : 'ONE_TIME'),
    timeConfig: template.timeConfig as any,
    recurrenceRule: template.recurrenceRule ?? null,
    reminderConfig: template.reminderConfig ?? null,
    importance: (template.importance as any) ?? 'Moderate',
    tags: template.tags ?? [],
    folderId: (template.folderId as any) ?? null,
    color: template.color ?? null,
  });
  if (result) {
    showCreateDialog.value = false;
    toast.success(t('task.management.createSuccess'));
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
    taskType:
      (vm.taskType as 'ONE_TIME' | 'RECURRING') ?? (vm.recurrenceRule ? 'RECURRING' : 'ONE_TIME'),
    timeConfig: vm.timeConfig as any,
    recurrenceRule: vm.recurrenceRule ?? null,
    reminderConfig: vm.reminderConfig ?? null,
    importance: (vm.importance as any) ?? 'Moderate',
    tags: vm.tags ?? [],
    folderId: (vm.folderId as any) ?? null,
    color: vm.color ?? null,
  });
  if (result) {
    showEditDialog.value = false;
    editViewModel.value = null;
    toast.success(t('task.management.editSuccess'));
    await fetchTemplates();
  }
}

async function handleDelete(template: TaskTemplateViewModel) {
  if (!window.confirm(t('task.management.confirmDelete', { name: template.title }))) return;
  await deleteTemplate(template.id);
}

async function handleResume(template: TaskTemplateViewModel) {
  await activateTemplate(template.id);
}

async function handleDeleteAll() {
  if (!window.confirm(t('task.management.confirmDeleteAll'))) return;
  for (const t_ of templates.value) {
    await deleteTemplate(t_.id);
  }
  toast.success(t('task.management.allDeleted'));
}

onMounted(async () => {
  await fetchTemplates();
});
</script>
