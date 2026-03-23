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
          <CardContent class="grid gap-4 sm:grid-cols-2">
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
              <p class="text-sm">{{ formatDate(currentTemplate?.createdAt) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.updateTime') }}
              </p>
              <p class="text-sm">{{ formatDate(currentTemplate?.updatedAt) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.templateStartDate') }}
              </p>
              <p class="text-sm">{{ formatDate(currentTemplate?.timeConfig?.startDate) }}</p>
            </div>
            <div>
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.timeType') }}
              </p>
              <p class="text-sm">{{ getTimeTypeLabel(currentTemplate?.timeConfig?.timeType) }}</p>
            </div>
            <div class="sm:col-span-2">
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.timeValue') }}
              </p>
              <p class="text-sm">{{ detailViewModel.timeConfig.displayText }}</p>
            </div>
            <div v-if="detailViewModel.description" class="sm:col-span-2">
              <p class="text-sm font-medium text-muted-foreground">
                {{ t('task.detail.description') }}
              </p>
              <p class="text-sm">{{ detailViewModel.description }}</p>
            </div>
            <div class="sm:col-span-2">
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

        <!-- Stats Card -->
        <Card>
          <CardHeader>
            <CardTitle>{{ t('task.detail.executionStats') }}</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-lg border p-4 text-center">
              <p class="text-2xl font-bold">{{ detailViewModel.instanceCount ?? 0 }}</p>
              <p class="text-xs text-muted-foreground">{{ t('task.detail.totalInstances') }}</p>
            </div>
            <div class="rounded-lg border p-4 text-center">
              <p class="text-2xl font-bold">{{ detailViewModel.completedInstanceCount ?? 0 }}</p>
              <p class="text-xs text-muted-foreground">{{ t('task.detail.completed') }}</p>
            </div>
            <div class="rounded-lg border p-4 text-center">
              <p class="text-2xl font-bold">
                {{ Math.round(detailViewModel.completionRate ?? 0) }}%
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
import { TaskGoalBindingTrigger } from '@dailyuse/contracts/task';
import {
  getTaskTimeTypeLabel,
  mapTaskTemplateDtoToViewModel,
} from '../utils/taskTemplatePresentation';

const route = useRoute();
const router = useRouter();
const { t, locale } = useI18n();
const { currentTemplate, isLoading, isSaving, fetchTemplate, updateTemplate } = useTask();

const showEditDialog = ref(false);

const detailViewModel = computed<TaskTemplateViewModel | null>(() => {
  if (!currentTemplate.value) return null;
  return mapTaskTemplateDtoToViewModel(currentTemplate.value, t);
});

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
    goalBinding:
      vm.goalBinding?.goalId && vm.goalBinding?.keyResultId
        ? {
            goalId: vm.goalBinding.goalId,
            keyResultId: vm.goalBinding.keyResultId,
            goalRecordValue: vm.goalBinding.incrementValue ?? 1,
            progressTrigger:
              vm.goalBinding.progressTrigger ?? TaskGoalBindingTrigger.PerInstance,
          }
        : vm.goalBinding === null
          ? null
          : undefined,
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

function getTimeTypeLabel(type?: string | null): string {
  return getTaskTimeTypeLabel(t, type);
}

onMounted(async () => {
  const id = route.params.id as string;
  if (id && id !== 'new') {
    await fetchTemplate(id);
  }
});
</script>
