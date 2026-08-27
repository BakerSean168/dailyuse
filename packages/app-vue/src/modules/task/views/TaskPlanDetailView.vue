<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden bg-background" data-testid="task-plan-detail-view">
    <header class="flex min-h-14 shrink-0 items-center gap-2 border-b px-3 @2xl/panel:px-6">
      <Button variant="ghost" size="sm" @click="router.push({ name: 'task-plans' })">
        <ArrowLeft class="mr-1 h-4 w-4" />{{ t('common.back') }}
      </Button>
      <div v-if="template" class="min-w-0">
        <h1 class="truncate font-semibold">{{ template.name }}</h1>
        <p class="text-xs text-muted-foreground">{{ t('task.plan.settings') }}</p>
      </div>
      <div v-if="template" class="ml-auto flex flex-wrap gap-1">
        <Button v-if="template.status !== 'Closed'" variant="ghost" size="sm" :disabled="isSaving" @click="openEdit">
          {{ t('common.edit') }}
        </Button>
        <Button v-if="template.status === 'Active'" variant="ghost" size="sm" :disabled="isSaving" @click="pause">
          {{ t('task.plan.pause') }}
        </Button>
        <Button v-else-if="template.status === 'Paused'" variant="ghost" size="sm" :disabled="isSaving" @click="resume">
          {{ t('task.plan.resume') }}
        </Button>
        <Button v-if="template.status !== 'Closed'" variant="ghost" size="sm" class="text-destructive" :disabled="isSaving" @click="endPlan">
          {{ t('task.plan.end') }}
        </Button>
      </div>
    </header>

    <div v-if="isLoading" class="flex flex-1 items-center justify-center text-sm text-muted-foreground">{{ t('common.loading') }}</div>
    <div v-else-if="error" class="m-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{{ error }}</div>
    <div v-else-if="template" class="min-h-0 flex-1 overflow-auto px-3 py-4 @2xl/panel:px-6">
      <div class="mx-auto max-w-3xl space-y-4">
        <article class="rounded-xl border bg-card p-5">
          <div class="flex flex-wrap items-center gap-2">
            <Badge>{{ planStatus }}</Badge>
            <Badge v-if="template.outcome !== 'Open'" variant="outline" data-testid="task-plan-outcome">{{ template.outcome }}</Badge>
          </div>
          <dl class="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt class="text-muted-foreground">{{ t('task.plan.repeat') }}</dt>
              <dd class="mt-1 font-medium">{{ recurrenceText }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">{{ t('task.plan.progress') }}</dt>
              <dd class="mt-1 font-medium" data-testid="task-plan-completion">{{ completionText }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground">{{ t('task.plan.next') }}</dt>
              <dd class="mt-1 font-medium" data-testid="task-plan-next-occurrence">
                {{ nextOccurrence ? `${formatProductDate(nextOccurrence.instanceDate)} · ${getTaskTimeValueDisplay(t, nextOccurrence.timeConfig)}` : t('task.plan.noNext') }}
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground">{{ t('task.plan.started') }}</dt>
              <dd class="mt-1 font-medium">{{ template.startDate ? formatProductDate(template.startDate) : '-' }}</dd>
            </div>
          </dl>

          <div v-if="template.labels.length" class="mt-5 flex flex-wrap gap-1.5">
            <Badge v-for="label in template.labels" :key="label.id" variant="outline">#{{ label.name }}</Badge>
          </div>

          <div v-if="goalDisplay" class="mt-5 rounded-lg border bg-muted/20 p-4" data-testid="task-plan-goal-context">
            <button type="button" class="w-full text-left" @click="openLinkedKeyResult">
              <p class="text-xs text-muted-foreground">{{ t('task.occurrence.linkedGoal') }}</p>
              <p class="mt-1 text-sm font-medium">{{ goalDisplay.goalName }} / {{ goalDisplay.keyResultName }}</p>
              <p v-if="contributionText" class="mt-1 text-xs text-muted-foreground">{{ contributionText }}</p>
            </button>
          </div>
        </article>

        <section class="space-y-2">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-medium">{{ t('task.plan.occurrences') }}</h2>
            <span class="text-xs text-muted-foreground">{{ orderedInstances.length }}</span>
          </div>
          <div v-if="orderedInstances.length" class="divide-y overflow-hidden rounded-lg border bg-card">
            <button
              v-for="instance in orderedInstances"
              :key="instance.id"
              type="button"
              class="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
              @click="openOccurrence(String(instance.id))"
            >
              <span class="min-w-0 flex-1 text-sm">{{ formatProductDate(instance.instanceDate) }}</span>
              <span class="text-xs text-muted-foreground">{{ getTaskTimeValueDisplay(t, instance.timeConfig) }}</span>
              <Badge variant="outline">{{ t(`task.instanceStatus.${instance.status.toLowerCase()}`) }}</Badge>
              <ChevronRight class="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          <p v-else class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground" data-testid="task-plan-empty-occurrences">
            {{ t('task.plan.noOccurrences') }}
          </p>
        </section>
      </div>
    </div>
    <div v-else class="flex flex-1 items-center justify-center text-sm text-muted-foreground" data-testid="task-plan-not-found">
      {{ t('task.plan.notFound') }}
    </div>

    <TaskTemplateDialog
      v-if="viewModel"
      v-model="showEditDialog"
      mode="edit"
      :template="viewModel"
      :saving="isSaving"
      @save="saveEdit"
      @cancel="showEditDialog = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, ChevronRight } from '@lucide/vue';
import { Badge, Button, useConfirm } from '@memoflow/ui-vue-shadcn';
import type { GoalId, KeyResultId } from '@memoflow/contracts/primitives';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import type { RecurrenceRuleDTO, TaskReminderConfigDTO } from '@memoflow/contracts/task';
import TaskTemplateDialog from '../components/dialogs/TaskTemplateDialog.vue';
import type { TaskTemplateViewModel } from '../components/types';
import { useTaskTemplateDetailQuery } from '../composables/useTaskTemplateDetailQuery';
import { useTaskOccurrenceListQuery } from '../composables/useTaskOccurrenceQueries';
import { useTaskTemplateMutations } from '../composables/useTaskTemplateMutations';
import { useTaskGoalBindingOptions } from '../composables/useTaskGoalBindingOptions';
import {
  getTaskRecurrenceText,
  getTaskTimeValueDisplay,
  mapTaskTemplateDtoToViewModel,
  toTaskTimeConfigPayload,
} from '../utils/task-template-presentation';
import { resolveTaskPlanNextOccurrence, sortTaskOccurrences } from '../utils/task-detail-projection';
import { formatProductDate } from '../../../shared/utils/product-time';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const id = computed(() => String(route.params.id ?? ''));
const { currentTemplate: template, isLoading: templateLoading, error: templateError, refetch: refetchTemplate } = useTaskTemplateDetailQuery(id);
const { instances, isLoading: instancesLoading, error: instancesError, refetch: refetchInstances } = useTaskOccurrenceListQuery(id);
const { updateTemplateSafe, activateTemplateSafe, pauseTemplateSafe, abandonPlanSafe, isSaving } = useTaskTemplateMutations();
const { loadGoalBinding, resolveGoalBinding } = useTaskGoalBindingOptions();
const showEditDialog = ref(false);
const isLoading = computed(() => templateLoading.value || instancesLoading.value);
const error = computed(() => templateError.value ?? instancesError.value);
const viewModel = computed(() => template.value ? mapTaskTemplateDtoToViewModel(template.value, t) : null);
const orderedInstances = computed(() => sortTaskOccurrences(instances.value));
const nextOccurrence = computed(() => template.value ? resolveTaskPlanNextOccurrence(String(template.value.id), instances.value) : null);
const recurrenceText = computed(() => template.value ? getTaskRecurrenceText(t, template.value) : '');
const planStatus = computed(() => template.value?.status === 'Active' ? t('task.plan.active') : template.value?.status === 'Paused' ? t('task.plan.paused') : t('task.plan.ended'));
const completionText = computed(() => {
  if (!template.value) return '';
  const total = template.value.recurrenceRule?.occurrences;
  return total
    ? t('task.plan.completedFinite', { completed: template.value.completedInstanceCount, total })
    : t('task.plan.completedOpen', { completed: template.value.completedInstanceCount });
});

watch(() => template.value?.goalBinding?.goalId, (goalId) => { if (goalId) void loadGoalBinding(String(goalId)); }, { immediate: true });
const goalDisplay = computed(() => template.value ? resolveGoalBinding(template.value.goalBinding ? { ...template.value.goalBinding, contribution: template.value.goalBinding.contribution ?? undefined } : null) : null);
const contributionText = computed(() => {
  const contribution = template.value?.goalBinding?.contribution;
  return contribution ? t(`task.krLinks.previewText.${contribution.trigger}`, { value: contribution.value }) : null;
});

async function refresh(): Promise<void> { await Promise.all([refetchTemplate(), refetchInstances()]); }
function openEdit(): void { showEditDialog.value = true; }
async function pause(): Promise<void> { if (await pauseTemplateSafe(id.value)) await refresh(); }
async function resume(): Promise<void> { if (await activateTemplateSafe(id.value)) await refresh(); }
async function endPlan(): Promise<void> {
  if (!template.value) return;
  const confirmed = await useConfirm({
    title: t('task.plan.endConfirmTitle'),
    description: t('task.plan.endConfirmDescription', { name: template.value.name }),
    confirmText: t('task.plan.end'),
    cancelText: t('common.cancel'),
    variant: 'destructive',
  });
  if (confirmed && await abandonPlanSafe(id.value)) await refresh();
}
function goalBinding(vm: TaskTemplateViewModel) {
  if (!vm.goalBinding?.goalId || !vm.goalBinding.keyResultId) return vm.goalBinding === null ? null : undefined;
  return {
    goalId: vm.goalBinding.goalId as GoalId,
    keyResultId: vm.goalBinding.keyResultId as KeyResultId,
    contribution: vm.goalBinding.contribution ?? null,
  };
}
async function saveEdit(vm: TaskTemplateViewModel): Promise<void> {
  const result = await updateTemplateSafe(id.value, {
    name: vm.title,
    description: vm.description ?? null,
    timeConfig: toTaskTimeConfigPayload(vm.timeConfig),
    recurrenceRule: (vm.recurrenceRule as unknown as RecurrenceRuleDTO) ?? null,
    reminderConfig: (vm.reminderConfig as unknown as TaskReminderConfigDTO | null) ?? null,
    importance: (vm.importance as ImportanceLevel) ?? ImportanceLevel.Moderate,
    labelIds: vm.labelIds ?? [],
    checklist: (vm.checklist ?? []).map((item, order) => ({ title: item.title.trim(), order })),
    goalBinding: goalBinding(vm),
  });
  if (result) { showEditDialog.value = false; await refresh(); }
}
function openOccurrence(instanceId: string): void { void router.push({ name: 'task-occurrence-detail', params: { id: instanceId } }); }
function openLinkedKeyResult(): void {
  const binding = template.value?.goalBinding;
  if (!binding) return;
  void router.push({ name: 'key-result-detail', params: { goalId: String(binding.goalId), keyResultId: String(binding.keyResultId) } });
}
</script>
