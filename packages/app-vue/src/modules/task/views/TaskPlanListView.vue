<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden bg-background" data-testid="task-plan-list-view">
    <header class="flex min-h-14 shrink-0 items-center gap-2 border-b px-3 @2xl/panel:px-6">
      <Button variant="ghost" size="sm" @click="router.push({ name: 'task-list' })">
        <ArrowLeft class="mr-1 h-4 w-4" />{{ t('common.back') }}
      </Button>
      <div>
        <h1 class="font-semibold">{{ t('task.plan.title') }}</h1>
        <p class="text-xs text-muted-foreground">{{ t('task.plan.subtitle') }}</p>
      </div>
    </header>

    <div v-if="isLoading" class="flex flex-1 items-center justify-center text-sm text-muted-foreground">
      {{ t('common.loading') }}
    </div>
    <div v-else-if="error" class="m-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
      {{ error }}
    </div>
    <div v-else class="min-h-0 flex-1 overflow-auto px-3 py-4 @2xl/panel:px-6">
      <div v-if="plans.length === 0" class="mx-auto mt-10 max-w-lg rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        {{ t('task.plan.empty') }}
      </div>
      <div v-else class="mx-auto max-w-4xl divide-y overflow-hidden rounded-lg border bg-card">
        <article v-for="plan in plans" :key="plan.id" class="flex items-center gap-3 px-4 py-3" data-testid="task-plan-row">
          <button class="min-w-0 flex-1 text-left" type="button" @click="openPlan(String(plan.id))">
            <div class="flex flex-wrap items-center gap-2">
              <p class="truncate text-sm font-medium">{{ plan.name }}</p>
              <Badge variant="outline">{{ statusLabel(plan.status) }}</Badge>
            </div>
            <div class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>{{ getTaskRecurrenceText(t, plan) }}</span>
              <span>{{ completionText(plan) }}</span>
              <span v-if="nextOccurrence(plan)">{{ t('task.plan.next') }}: {{ formatProductDate(nextOccurrence(plan)!.instanceDate) }}</span>
              <span v-else>{{ t('task.plan.noNext') }}</span>
            </div>
          </button>
          <Button
            v-if="plan.status === 'Active'"
            variant="ghost"
            size="sm"
            :disabled="isSaving"
            @click="pause(String(plan.id))"
          >{{ t('task.plan.pause') }}</Button>
          <Button
            v-else-if="plan.status === 'Paused'"
            variant="ghost"
            size="sm"
            :disabled="isSaving"
            @click="resume(String(plan.id))"
          >{{ t('task.plan.resume') }}</Button>
          <Button variant="ghost" size="icon" :aria-label="t('task.plan.open')" @click="openPlan(String(plan.id))">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { ArrowLeft, ChevronRight } from '@lucide/vue';
import { Badge, Button } from '@memoflow/ui-vue-shadcn';
import type { TaskTemplateClientDTO } from '@memoflow/contracts/task';
import { useTaskTemplateListQuery } from '../composables/useTaskTemplateListQuery';
import { useTaskOccurrenceListQuery } from '../composables/useTaskOccurrenceQueries';
import { useTaskTemplateMutations } from '../composables/useTaskTemplateMutations';
import { getTaskRecurrenceText } from '../utils/task-template-presentation';
import { resolveTaskPlanNextOccurrence } from '../utils/task-detail-projection';
import { formatProductDate } from '../../../shared/utils/product-time';

const router = useRouter();
const { t } = useI18n();
const { templates, isLoading: templatesLoading, error: templatesError, refetch: refetchTemplates } = useTaskTemplateListQuery({ page: 1, limit: 500 });
const { instances, isLoading: instancesLoading, error: instancesError, refetch: refetchInstances } = useTaskOccurrenceListQuery();
const { pauseTemplateSafe, activateTemplateSafe, isSaving } = useTaskTemplateMutations();
const plans = computed(() => templates.value.filter((template) => template.recurrenceRule !== null && template.deletedAt === null));
const isLoading = computed(() => templatesLoading.value || instancesLoading.value);
const error = computed(() => templatesError.value ?? instancesError.value);

function statusLabel(status: TaskTemplateClientDTO['status']): string {
  return status === 'Active' ? t('task.plan.active') : status === 'Paused' ? t('task.plan.paused') : t('task.plan.ended');
}
function completionText(plan: TaskTemplateClientDTO): string {
  const total = plan.recurrenceRule?.occurrences;
  return total
    ? t('task.plan.completedFinite', { completed: plan.completedInstanceCount, total })
    : t('task.plan.completedOpen', { completed: plan.completedInstanceCount });
}
function nextOccurrence(plan: TaskTemplateClientDTO) {
  return resolveTaskPlanNextOccurrence(String(plan.id), instances.value);
}
function openPlan(id: string): void { void router.push({ name: 'task-plan-detail', params: { id } }); }
async function refresh(): Promise<void> { await Promise.all([refetchTemplates(), refetchInstances()]); }
async function pause(id: string): Promise<void> { if (await pauseTemplateSafe(id)) await refresh(); }
async function resume(id: string): Promise<void> { if (await activateTemplateSafe(id)) await refresh(); }
</script>
