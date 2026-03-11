<template>
  <div class="flex h-full flex-col overflow-hidden bg-background">
    <!-- Header -->
    <header
      class="z-10 flex h-14 shrink-0 items-center justify-between border-b bg-background/50 px-6 backdrop-blur-sm"
    >
      <div class="flex items-center gap-3">
        <Button variant="ghost" size="icon" class="h-8 w-8" @click="router.back()">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" class="h-4" />
        <h1 class="text-lg font-medium text-foreground">
          {{ currentTemplate?.name || t('task.detail.title') }}
        </h1>
        <Badge v-if="currentTemplate" :variant="statusVariant">{{ currentTemplate.status }}</Badge>
      </div>
      <div v-if="currentTemplate" class="flex items-center gap-2">
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
        v-else-if="!currentTemplate"
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
          <CardContent class="grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.importance') }}
              </p>
              <p class="text-sm">{{ currentTemplate.importance }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.priority') }}
              </p>
              <p class="text-sm">{{ currentTemplate.priority }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.createTime') }}
              </p>
              <p class="text-sm">{{ formatDate(currentTemplate.createdAt) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.updateTime') }}
              </p>
              <p class="text-sm">{{ formatDate(currentTemplate.updatedAt) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.templateStartDate') }}
              </p>
              <p class="text-sm">{{ formatDate(currentTemplate.timeConfig?.startDate) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.timeType') }}
              </p>
              <p class="text-sm">{{ getTimeTypeLabel(currentTemplate.timeConfig?.timeType) }}</p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.timeValue') }}
              </p>
              <p class="text-sm">{{ getTimeValueDisplay(currentTemplate.timeConfig) }}</p>
            </div>
            <div v-if="currentTemplate.description" class="sm:col-span-2">
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.description') }}
              </p>
              <p class="text-sm">{{ currentTemplate.description }}</p>
            </div>
            <div v-if="currentTemplate.tags?.length" class="sm:col-span-2">
              <p class="mb-1 text-sm font-medium text-muted-foreground">
                {{ t('task.detail.tags') }}
              </p>
              <div class="flex flex-wrap gap-1">
                <Badge v-for="tag in currentTemplate.tags" :key="tag" variant="secondary">{{
                  tag
                }}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Stats Card -->
        <Card>
          <CardHeader>
            <CardTitle>{{ t('task.detail.executionStats') }}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-lg border p-4 text-center">
              <p class="text-2xl font-bold">{{ currentTemplate.instanceCount ?? 0 }}</p>
              <p class="text-xs text-muted-foreground">{{ t('task.detail.totalInstances') }}</p>
            </div>
            <div class="rounded-lg border p-4 text-center">
              <p class="text-2xl font-bold">{{ currentTemplate.completedInstanceCount ?? 0 }}</p>
              <p class="text-xs text-muted-foreground">{{ t('task.detail.completed') }}</p>
            </div>
            <div class="rounded-lg border p-4 text-center">
              <p class="text-2xl font-bold">
                {{ ((currentTemplate.completionRate ?? 0) * 100).toFixed(0) }}%
              </p>
              <p class="text-xs text-muted-foreground">{{ t('task.detail.completionRate') }}</p>
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
      @save="handleSaveEdit"
      @cancel="showEditDialog = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, FileQuestion, Pencil } from 'lucide-vue-next';
import {
  Button,
  Badge,
  Separator,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@dailyuse/ui-vue-shadcn';
import { useTask } from '../composables/useTask';
import TaskTemplateDialog from '../components/dialogs/TaskTemplateDialog.vue';
import type { TaskTemplateViewModel } from '../components/types';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const { currentTemplate, isLoading, isSaving, fetchTemplate, updateTemplate } = useTask();

const showEditDialog = ref(false);

const statusVariant = computed(() => {
  switch (currentTemplate.value?.status) {
    case 'Active':
      return 'default' as const;
    case 'Paused':
      return 'secondary' as const;
    case 'Archived':
      return 'outline' as const;
    default:
      return 'destructive' as const;
  }
});

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

/** 将 store 中的 DTO 转换为 Dialog 所需的 ViewModel */
const editViewModel = computed<TaskTemplateViewModel | null>(() => {
  const dto = currentTemplate.value;
  if (!dto) return null;
  const status = statusMap[dto.status] ?? dto.status;
  return {
    id: dto.id,
    title: dto.name,
    description: dto.description ?? undefined,
    status,
    isActive: status === 'ACTIVE',
    isPaused: status === 'PAUSED',
    isArchived: status === 'ARCHIVED',
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
      timeType:
        timeTypeMap[dto.timeConfig?.timeType] ??
        (dto.timeConfig?.timeType as TaskTemplateViewModel['timeConfig']['timeType']),
      timePoint: dto.timeConfig?.timePoint ?? undefined,
      timeRange: dto.timeConfig?.timeRange ?? undefined,
      startDate: dto.timeConfig?.startDate ?? undefined,
    },
    recurrenceRule: dto.recurrenceRule ?? null,
    reminderConfig: dto.reminderConfig ?? null,
    instanceCount: dto.instanceCount,
    completionRate: dto.completionRate,
    formattedCreatedAt: dto.createdAt ? new Date(dto.createdAt).toLocaleDateString() : undefined,
  };
});

function openEditDialog() {
  showEditDialog.value = true;
}

async function handleSaveEdit(vm: TaskTemplateViewModel) {
  const id = route.params.id as string;
  const result = await updateTemplate(id, {
    name: vm.title,
    description: vm.description ?? null,
    timeConfig: vm.timeConfig as any,
    recurrenceRule: vm.recurrenceRule ?? null,
    importance: (vm.importance as any) ?? 'Moderate',
    tags: vm.tags ?? [],
    color: vm.color ?? null,
  });
  if (result) {
    showEditDialog.value = false;
    await fetchTemplate(id);
  }
}

function formatDate(ts?: number | null): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleDateString(locale.value);
}

function formatMinuteOfDay(minutes?: number | null): string {
  if (minutes == null) return '-';
  const safe = Math.max(0, Math.min(1439, minutes));
  const hour = Math.floor(safe / 60);
  const minute = safe % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getTimeTypeLabel(type?: string | null): string {
  switch (type) {
    case 'AllDay':
      return t('task.timeConfig.allDay');
    case 'TimePoint':
      return t('task.timeConfig.timePoint');
    case 'TimeRange':
      return t('task.timeConfig.timeRange');
    default:
      return '-';
  }
}

function getTimeValueDisplay(
  timeConfig?: {
    timeType?: string;
    timePoint?: number | null;
    timeRange?: { start: number; end: number } | null;
  } | null,
): string {
  if (!timeConfig) return '-';
  if (timeConfig.timeType === 'AllDay') return t('task.timeConfig.allDay');
  if (timeConfig.timeType === 'TimePoint') return formatMinuteOfDay(timeConfig.timePoint);
  if (timeConfig.timeType === 'TimeRange' && timeConfig.timeRange) {
    return `${formatMinuteOfDay(timeConfig.timeRange.start)} - ${formatMinuteOfDay(timeConfig.timeRange.end)}`;
  }
  return '-';
}

onMounted(async () => {
  const id = route.params.id as string;
  if (id && id !== 'new') {
    await fetchTemplate(id);
  }
});
</script>
