<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden bg-background" data-testid="task-detail-view">
    <header class="flex min-h-14 shrink-0 items-center gap-2 border-b px-3 @2xl/panel:px-6">
      <Button variant="ghost" size="sm" @click="router.push({ name: 'task-list' })">
        <ArrowLeft class="mr-1 h-4 w-4" />{{ t('common.back') }}
      </Button>
      <div v-if="detail" class="min-w-0">
        <h1 class="truncate font-semibold">{{ detail.template.name }}</h1>
        <p class="text-xs text-muted-foreground">{{ formatProductDate(detail.instance.instanceDate) }}</p>
      </div>
    </header>

    <div v-if="isLoading" class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      {{ t('common.loading') }}
    </div>
    <div v-else-if="error" class="m-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {{ error }}
    </div>
    <div v-else-if="detail" class="min-h-0 flex-1 overflow-auto px-3 py-4 @2xl/panel:px-6">
      <div class="mx-auto max-w-3xl space-y-4">
        <article class="rounded-xl border bg-card p-5" data-testid="task-occurrence-detail">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <Badge :variant="detail.instance.status === 'Completed' ? 'default' : 'secondary'" data-testid="task-occurrence-status">
                  {{ instanceStatusLabel }}
                </Badge>
                <Badge v-if="detail.instance.isOverdue && canCorrect" variant="destructive" data-testid="task-occurrence-overdue">
                  {{ t('task.occurrence.overdue') }}
                </Badge>
                <Badge v-if="repeatPosition" variant="outline" data-testid="task-repeat-position">
                  {{ repeatPositionText }}
                </Badge>
              </div>
              <h2 class="text-xl font-semibold">{{ detail.template.name }}</h2>
              <p v-if="detail.template.description" class="max-w-2xl whitespace-pre-wrap text-sm text-muted-foreground">
                {{ detail.template.description }}
              </p>
            </div>
            <div class="text-right text-sm">
              <p class="font-medium">{{ formatProductDate(detail.instance.instanceDate) }}</p>
              <p class="text-muted-foreground">{{ getTaskTimeValueDisplay(t, detail.instance.timeConfig) }}</p>
            </div>
          </div>

          <div v-if="detail.template.labels.length" class="mt-4 flex flex-wrap gap-1.5" data-testid="task-occurrence-labels">
            <Badge v-for="label in detail.template.labels" :key="label.id" variant="outline">#{{ label.name }}</Badge>
          </div>

          <div v-if="goalDisplay" class="mt-5 rounded-lg border bg-muted/20 p-4" data-testid="task-occurrence-goal-context">
            <button
              type="button"
              class="w-full text-left"
              data-testid="task-occurrence-goal-link"
              @click="openLinkedKeyResult"
            >
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ t('task.occurrence.linkedGoal') }}</p>
              <p class="mt-1 text-sm font-medium">{{ goalDisplay.goalName }}</p>
              <p class="text-sm text-muted-foreground">› {{ goalDisplay.keyResultName }}</p>
              <p v-if="contributionText" class="mt-2 text-xs text-muted-foreground">{{ contributionText }}</p>
            </button>
          </div>

          <div v-if="detail.instance.comment" class="mt-5 border-t pt-4">
            <p class="text-xs font-medium text-muted-foreground">{{ t('task.occurrence.note') }}</p>
            <p class="mt-1 whitespace-pre-wrap text-sm">{{ detail.instance.comment }}</p>
          </div>

          <div v-if="detail.template.recurrenceRule" class="mt-5 border-t pt-4">
            <Button variant="ghost" size="sm" data-testid="task-view-repeat-settings" @click="openPlanSettings">
              <Repeat2 class="mr-1 h-4 w-4" />{{ t('task.occurrence.viewRepeatSettings') }}
              <ChevronRight class="ml-1 h-4 w-4" />
            </Button>
          </div>
        </article>

        <div class="flex flex-wrap justify-end gap-2" data-testid="task-occurrence-actions">
          <Button
            v-if="detail.instance.status === 'Completed'"
            variant="outline"
            :disabled="acting"
            data-testid="task-occurrence-uncomplete"
            @click="undoComplete"
          >
            {{ t('task.action.undoComplete') }}
          </Button>
          <template v-else>
            <Button
              v-if="canCorrect"
              variant="outline"
              :disabled="acting"
              data-testid="task-occurrence-missed"
              @click="markMissed"
            >
              {{ t('task.occurrence.markMissed') }}
            </Button>
            <Button
              v-if="canCorrect"
              variant="outline"
              :disabled="acting"
              data-testid="task-occurrence-skip"
              @click="skip"
            >
              {{ t('task.action.skip') }}
            </Button>
            <Button
              v-if="canComplete"
              :disabled="acting"
              data-testid="task-occurrence-complete"
              @click="complete"
            >
              <Check class="mr-1 h-4 w-4" />{{ correctionCompleteLabel }}
            </Button>
          </template>
        </div>
      </div>
    </div>
    <div v-else class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      {{ t('task.occurrence.notFound') }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, Check, ChevronRight, Repeat2 } from '@lucide/vue';
import { Badge, Button } from '@memoflow/ui-vue-shadcn';
import { useTaskOccurrenceDetailQuery } from '../composables/useTaskOccurrenceQueries';
import { useTaskInstances } from '../composables/useTaskInstances';
import { useTaskGoalBindingOptions } from '../composables/useTaskGoalBindingOptions';
import { formatProductDate } from '../../../shared/utils/product-time';
import { getTaskTimeValueDisplay } from '../utils/task-template-presentation';
import {
  canCompleteTaskOccurrence,
  canCorrectTaskOccurrence,
  resolveTaskRepeatPosition,
} from '../utils/task-detail-projection';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const instanceId = computed(() => String(route.params.id ?? ''));
const { detail, isLoading, error, refetch } = useTaskOccurrenceDetailQuery(instanceId);
const { completeInstance, uncompleteInstance, skipInstance, markInstanceMissed } = useTaskInstances();
const { loadGoalBinding, resolveGoalBinding } = useTaskGoalBindingOptions();
const acting = ref(false);

watch(
  () => detail.value?.template.goalBinding?.goalId,
  (goalId) => {
    if (goalId) void loadGoalBinding(String(goalId));
  },
  { immediate: true },
);

const repeatPosition = computed(() =>
  detail.value
    ? resolveTaskRepeatPosition(instanceId.value, detail.value.template, detail.value.planInstances)
    : null,
);
const repeatPositionText = computed(() => {
  const value = repeatPosition.value;
  if (!value) return '';
  return value.total
    ? t('task.occurrence.repeatPositionFinite', { position: value.position, total: value.total })
    : t('task.occurrence.repeatPositionOpen', { position: value.position });
});
const instanceStatusLabel = computed(() =>
  detail.value ? t(`task.instanceStatus.${detail.value.instance.status.toLowerCase()}`) : '',
);
const canComplete = computed(() =>
  detail.value ? canCompleteTaskOccurrence(detail.value.instance.status) : false,
);
const canCorrect = computed(() =>
  detail.value ? canCorrectTaskOccurrence(detail.value.instance.status) : false,
);
const correctionCompleteLabel = computed(() =>
  detail.value && ['Missed', 'Skipped'].includes(detail.value.instance.status)
    ? t('task.occurrence.correctToCompleted')
    : t('task.action.complete'),
);
const goalDisplay = computed(() =>
  detail.value ? resolveGoalBinding(detail.value.template.goalBinding ? { ...detail.value.template.goalBinding, contribution: detail.value.template.goalBinding.contribution ?? undefined } : null) : null,
);
const contributionText = computed(() => {
  const contribution = detail.value?.template.goalBinding?.contribution;
  if (!contribution) return null;
  return t(`task.krLinks.previewText.${contribution.trigger}`, { value: contribution.value });
});

async function withAction(action: () => Promise<unknown>): Promise<void> {
  if (acting.value) return;
  acting.value = true;
  try {
    await action();
    await refetch();
  } finally {
    acting.value = false;
  }
}
function complete() { return withAction(() => completeInstance(instanceId.value)); }
function undoComplete() { return withAction(() => uncompleteInstance(instanceId.value)); }
function skip() { return withAction(() => skipInstance(instanceId.value)); }
function markMissed() { return withAction(() => markInstanceMissed(instanceId.value)); }
function openPlanSettings(): void {
  const templateId = detail.value?.template.id;
  if (templateId) void router.push({ name: 'task-plan-detail', params: { id: String(templateId) } });
}
function openLinkedKeyResult(): void {
  const binding = detail.value?.template.goalBinding;
  if (!binding) return;
  void router.push({
    name: 'key-result-detail',
    params: { goalId: String(binding.goalId), keyResultId: String(binding.keyResultId) },
  });
}
</script>
