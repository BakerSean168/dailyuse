<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-4">
        <h1 class="text-lg font-medium text-foreground">任务管理</h1>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative hidden w-64 lg:block">
          <Search class="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="searchQuery"
            placeholder="搜索任务模板..."
            class="h-8 w-full border-transparent bg-secondary/50 pl-8 focus-visible:border-ring focus-visible:bg-background"
          />
        </div>
      </div>
    </header>

    <!-- Content -->
    <div class="flex-1 overflow-auto">
      <div
        v-if="isLoading"
        class="flex h-[50vh] items-center justify-center text-muted-foreground"
      >
        加载中...
      </div>

      <TaskTemplateManagement
        v-else
        :templates="filteredViewModels"
        :dependencies="[]"
        @create-template="handleCreate"
        @edit-template="handleEdit"
        @delete-template="handleDelete"
        @resume-template="handleResume"
        @delete-all-templates="handleDeleteAll"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner';
import { Search } from 'lucide-vue-next';
import { Input } from '@dailyuse/ui-vue-shadcn';
import TaskTemplateManagement from '../components/TaskTemplateManagement.vue';
import { useTask } from '../composables/useTask';
import type { TaskTemplateViewModel } from '../components/types';
import type { TaskTemplateClientDTO } from '@dailyuse/contracts/task';

const router = useRouter();
const { templates, isLoading, fetchTemplates, deleteTemplate, activateTemplate } = useTask();

const searchQuery = ref('');

const timeTypeMap: Record<string, TaskTemplateViewModel['timeConfig']['timeType']> = {
  AllDay: 'ALL_DAY',
  TimePoint: 'TIME_POINT',
  TimeRange: 'TIME_RANGE',
};

function mapToViewModel(dto: TaskTemplateClientDTO): TaskTemplateViewModel {
  return {
    id: dto.id,
    title: dto.name,
    description: dto.description ?? undefined,
    status: dto.status,
    isActive: dto.status === 'ACTIVE',
    isPaused: dto.status === 'PAUSED',
    isArchived: dto.status === 'ARCHIVED',
    importance: dto.importance,
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
      timeType: timeTypeMap[dto.timeConfig?.timeType] ?? dto.timeConfig?.timeType,
      timePoint: dto.timeConfig?.timePoint ?? undefined,
      timeRange: dto.timeConfig?.timeRange ?? undefined,
      startDate: dto.startDate ?? undefined,
    },
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
  router.push({ name: 'task-detail', params: { id: 'new' } });
}

function handleEdit(templateId: string) {
  router.push({ name: 'task-detail', params: { id: templateId } });
}

async function handleDelete(template: TaskTemplateViewModel) {
  if (!window.confirm(`确认删除模板「${template.title}」？`)) return;
  await deleteTemplate(template.id);
}

async function handleResume(template: TaskTemplateViewModel) {
  await activateTemplate(template.id);
}

async function handleDeleteAll() {
  if (!window.confirm('确认删除所有模板？此操作不可撤销！')) return;
  for (const t of templates.value) {
    await deleteTemplate(t.id);
  }
  toast.success('所有模板已删除');
}

onMounted(async () => {
  await fetchTemplates();
});
</script>
