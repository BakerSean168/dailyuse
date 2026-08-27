<template>
  <section
    class="flex h-full min-h-0 flex-col overflow-hidden bg-background"
    data-testid="task-management-view"
  >
    <header
      class="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 @2xl/panel:px-6"
      data-testid="task-page-toolbar"
    >
      <div class="mr-1 min-w-0">
        <h1 class="text-base font-semibold">{{ t('task.home.title') }}</h1>
        <p class="text-[11px] text-muted-foreground">
          {{ t('task.home.visibleCount', { count: rows.length }) }}
        </p>
      </div>

      <nav class="flex items-center rounded-md bg-muted/60 p-0.5" :aria-label="t('task.home.views')">
        <Button
          v-for="view in executionViews"
          :key="view.id"
          type="button"
          size="sm"
          :variant="activeView === view.id ? 'secondary' : 'ghost'"
          class="h-7 px-2.5 text-xs"
          :data-testid="`task-view-${view.id}`"
          @click="activeView = view.id"
        >
          {{ view.label }}
        </Button>
      </nav>

      <LabelFilterPopover
        :model-value="selectedLabelIds"
        :options="labelOptions"
        :disabled="labelsLoading"
        :label="t('task.home.labels')"
        :search-placeholder="t('task.home.searchLabels')"
        :empty-text="t('task.home.noLabels')"
        :clear-label="t('common.clear')"
        :selection-hint="t('task.home.matchesAllLabels')"
        :aria-label="t('task.home.filterByLabels')"
        compact
        @update:model-value="selectedLabelIds = $event"
      />

      <Select :model-value="selectedGoalSelectValue" @update:model-value="handleGoalSelection">
        <SelectTrigger class="h-8 w-[150px] gap-1.5 text-xs" data-testid="task-goal-filter">
          <Target class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <SelectValue :placeholder="t('task.home.goalContext')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{{ t('task.home.allGoals') }}</SelectItem>
          <SelectItem v-for="goal in goals" :key="goal.id" :value="goal.id">
            {{ goal.title }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Select
        v-if="selectedGoalId"
        :model-value="selectedKeyResultSelectValue"
        @update:model-value="handleKeyResultSelection"
      >
        <SelectTrigger class="h-8 w-[160px] text-xs" data-testid="task-key-result-filter">
          <SelectValue :placeholder="t('task.home.keyResultContext')" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{{ t('task.home.allKeyResults') }}</SelectItem>
          <SelectItem v-for="keyResult in selectedGoalKeyResults" :key="keyResult.id" :value="keyResult.id">
            {{ keyResult.title }}
          </SelectItem>
        </SelectContent>
      </Select>

      <div v-if="activeView === 'all'" class="relative min-w-40 flex-1 max-w-60">
        <Search
          class="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="searchQuery"
          class="h-8 pl-7 text-xs"
          data-testid="task-search-input"
          :placeholder="t('task.home.searchPlaceholder')"
        />
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="ml-auto h-8"
        data-testid="task-plan-management-entry"
        @click="openPlans"
      >
        <Repeat2 class="mr-1 h-3.5 w-3.5" />{{ t('task.plan.manage') }}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        class="h-8 w-8"
        :aria-label="t('common.refresh')"
        @click="refreshHome"
      >
        <RefreshCw class="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        class="h-8"
        data-testid="create-task-entry"
        data-primary-action="create-task"
        @click="openCreate"
      >
        <Plus class="mr-1 h-4 w-4" />
        {{ t('task.home.newTask') }}
      </Button>
    </header>

    <div
      v-if="isLoading"
      class="flex flex-1 items-center justify-center text-sm text-muted-foreground"
    >
      {{ t('common.loading') }}
    </div>
    <div
      v-else-if="error"
      class="m-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
    >
      {{ error }}
    </div>
    <div
      v-else
      class="min-h-0 flex-1 overflow-auto px-3 py-4 @2xl/panel:px-6"
      data-testid="task-management-scroll"
    >
      <div
        v-if="rows.length === 0"
        class="mx-auto mt-10 max-w-lg rounded-lg border border-dashed p-8 text-center"
        data-testid="task-home-empty"
      >
        <CheckCircle2 class="mx-auto h-8 w-8 text-muted-foreground/40" />
        <p class="mt-3 text-sm font-medium">{{ emptyTitle }}</p>
        <p class="mt-1 text-xs text-muted-foreground">{{ t('task.home.emptyHint') }}</p>
      </div>

      <div v-else class="mx-auto max-w-4xl space-y-6">
        <section v-for="group in groupedRows" :key="group.key" class="space-y-2">
          <div class="flex items-center justify-between px-1">
            <h2 class="text-xs font-medium text-muted-foreground">{{ group.label }}</h2>
            <span class="text-[11px] text-muted-foreground">{{ group.rows.length }}</span>
          </div>

          <div class="divide-y overflow-hidden rounded-lg border bg-card">
            <article
              v-for="row in group.rows"
              :key="row.instance.id"
              class="group flex items-start gap-3 px-3 py-3 transition-colors hover:bg-muted/35"
              :class="{ 'opacity-60': isTerminal(row.instance.status) }"
              data-testid="task-occurrence-row"
              :data-task-instance-id="row.instance.id"
              :data-task-template-id="row.template.id"
            >
              <button
                type="button"
                class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                :class="completeButtonClass(row.instance.status)"
                :disabled="
                  row.instance.status === 'Skipped' ||
                  row.instance.status === 'Missed' ||
                  completingId === row.instance.id
                "
                :aria-label="
                  row.instance.status === 'Completed'
                    ? t('task.action.undoComplete')
                    : t('task.action.complete')
                "
                @click="handleComplete(row.instance)"
              >
                <Check
                  v-if="row.instance.status === 'Completed'"
                  class="h-3 w-3 text-primary-foreground"
                />
                <Loader2
                  v-else-if="completingId === row.instance.id"
                  class="h-3 w-3 animate-spin text-muted-foreground"
                />
              </button>

              <div class="min-w-0 flex-1">
                <div class="flex min-w-0 items-start gap-3">
                  <div class="min-w-0 flex-1">
                    <button
                      type="button"
                      class="block max-w-full truncate text-left text-sm font-medium hover:underline"
                      :class="{ 'line-through text-muted-foreground': row.instance.status === 'Completed' }"
                      data-testid="task-occurrence-open"
                      @click="openOccurrence(String(row.instance.id))"
                    >
                      {{ row.template.name }}
                    </button>
                    <p
                      v-if="row.template.description"
                      class="mt-0.5 line-clamp-1 text-xs text-muted-foreground"
                    >
                      {{ row.template.description }}
                    </p>
                  </div>
                  <span class="shrink-0 font-mono text-xs text-muted-foreground">
                    {{ timeLabel(row.instance) }}
                  </span>
                </div>

                <div class="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Badge
                    v-for="label in row.template.labels"
                    :key="label.id"
                    variant="outline"
                    class="h-5 px-1.5 text-[10px] font-normal"
                  >
                    #{{ label.name }}
                  </Badge>
                  <span v-if="goalContext(row.template)" class="inline-flex items-center gap-1">
                    <Target class="h-3 w-3" />
                    {{ goalContext(row.template) }}
                  </span>
                  <Badge
                    v-if="row.instance.isOverdue && !isTerminal(row.instance.status)"
                    variant="destructive"
                    class="h-5 px-1.5 text-[10px]"
                  >
                    {{ t('task.home.overdue') }}
                  </Badge>
                  <Badge
                    v-else-if="row.instance.status === 'Skipped' || row.instance.status === 'Missed'"
                    variant="secondary"
                    class="h-5 px-1.5 text-[10px]"
                  >
                    {{ instanceStatusLabel(row.instance.status) }}
                  </Badge>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </div>

    <TaskTemplateDialog
      v-model="dialogOpen"
      :mode="dialogMode"
      :template="null"
      :saving="isSaving"
      @save="saveTemplate"
      @cancel="closeDialog"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Check, CheckCircle2, Loader2, Plus, RefreshCw, Search, Target } from '@lucide/vue';
import {
  Badge,
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@memoflow/ui-vue-shadcn';
import type { GoalId, KeyResultId } from '@memoflow/contracts/primitives';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import {
  TaskType,
  type RecurrenceRuleDTO,
  type TaskReminderConfigDTO,
  type TaskInstanceClientDTO,
  type TaskTemplateClientDTO,
} from '@memoflow/contracts/task';
import TaskTemplateDialog from '../components/dialogs/TaskTemplateDialog.vue';
import type { TaskTemplateViewModel } from '../components/types';
import { useTaskTemplateListQuery } from '../composables/useTaskTemplateListQuery';
import { useTaskTemplateMutations } from '../composables/useTaskTemplateMutations';
import { useTaskInstances } from '../composables/useTaskInstances';
import { useTaskGoalBindingOptions } from '../composables/useTaskGoalBindingOptions';
import { useTaskStore } from '../stores/task-store';
import { useLabelCatalog } from '../../../shared/composables/useLabelCatalog';
import { LabelFilterPopover } from '../../../shared/components';
import { formatHHmmParts } from '../../../shared/utils/format-hhmm-parts';
import { formatProductDate } from '../../../shared/utils/product-time';
import { toTaskTimeConfigPayload } from '../utils/task-template-presentation';
import {
  projectTaskExecutionRows,
  resolveTaskExecutionFetchPlan,
  type TaskExecutionRow,
  type TaskExecutionView,
} from '../utils/task-execution-home';

const { t } = useI18n();
const router = useRouter();
const taskStore = useTaskStore();
const activeView = ref<TaskExecutionView>('today');
const selectedLabelIds = ref<string[]>([]);
const selectedGoalId = ref<string | null>(null);
const selectedKeyResultId = ref<string | null>(null);
const searchQuery = ref('');
const completingId = ref<string | null>(null);

const executionViews = computed<Array<{ id: TaskExecutionView; label: string }>>(() => [
  { id: 'today', label: t('task.home.today') },
  { id: 'upcoming', label: t('task.home.upcoming') },
  { id: 'all', label: t('common.all') },
  { id: 'completed', label: t('task.home.completed') },
]);

const templateQueryParams = computed(() => ({
  page: 1,
  limit: 500,
  ...(selectedLabelIds.value.length > 0 ? { labelIdsAll: selectedLabelIds.value } : {}),
  ...(selectedGoalId.value ? { goalId: selectedGoalId.value } : {}),
}));

const {
  templates,
  isLoading: templatesLoading,
  error: templatesError,
  refetch: refetchTemplates,
} = useTaskTemplateListQuery({ params: templateQueryParams });
const { options: labelOptions, isLoading: labelsLoading } = useLabelCatalog();
const {
  goals,
  keyResultsByGoal,
  loadGoals,
  loadKeyResults,
  loadGoalBindings,
} = useTaskGoalBindingOptions();
const {
  fetchInstances,
  fetchInstancesByDateRange,
  completeInstance,
  uncompleteInstance,
} = useTaskInstances();
const { createTemplateSafe, isSaving } = useTaskTemplateMutations();

const selectedGoalSelectValue = computed(() => selectedGoalId.value ?? '__all__');
const selectedKeyResultSelectValue = computed(() => selectedKeyResultId.value ?? '__all__');
const selectedGoalKeyResults = computed(() =>
  selectedGoalId.value ? (keyResultsByGoal.value[selectedGoalId.value] ?? []) : [],
);
const isLoading = computed(() => templatesLoading.value || taskStore.isLoading);
const error = computed(() => templatesError.value ?? taskStore.error);
const rows = computed(() =>
  projectTaskExecutionRows(taskStore.instances, templates.value, {
    keyResultId: selectedKeyResultId.value,
    search: activeView.value === 'all' ? searchQuery.value : '',
  }),
);

const groupedRows = computed(() => {
  const groups = new Map<string, { key: string; label: string; rows: TaskExecutionRow[] }>();
  for (const row of rows.value) {
    const key = formatProductDate(row.instance.instanceDate);
    const group = groups.get(key) ?? { key, label: key, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }
  return [...groups.values()];
});

const emptyTitle = computed(() => {
  switch (activeView.value) {
    case 'today':
      return t('task.home.emptyToday');
    case 'upcoming':
      return t('task.home.emptyUpcoming');
    case 'completed':
      return t('task.home.emptyCompleted');
    default:
      return t('task.home.emptyAll');
  }
});

async function refreshInstances(): Promise<void> {
  const plan = resolveTaskExecutionFetchPlan(activeView.value);
  if (plan.kind === 'range') {
    await fetchInstancesByDateRange(plan.startDate, plan.endDate);
    return;
  }
  await fetchInstances(plan.status ? { status: plan.status } : undefined);
}

async function refreshHome(): Promise<void> {
  await Promise.all([refetchTemplates(), refreshInstances()]);
}

async function handleGoalSelection(value: unknown): Promise<void> {
  const id = String(value ?? '__all__');
  selectedGoalId.value = id === '__all__' ? null : id;
  selectedKeyResultId.value = null;
  if (selectedGoalId.value) {
    await loadKeyResults(selectedGoalId.value);
  }
}

function handleKeyResultSelection(value: unknown): void {
  const id = String(value ?? '__all__');
  selectedKeyResultId.value = id === '__all__' ? null : id;
}

function isTerminal(status: TaskInstanceClientDTO['status']): boolean {
  return status === 'Completed' || status === 'Skipped' || status === 'Missed';
}

function completeButtonClass(status: TaskInstanceClientDTO['status']): string {
  if (status === 'Completed') return 'border-primary bg-primary';
  if (status === 'Skipped' || status === 'Missed') return 'border-muted bg-muted';
  return 'border-muted-foreground/50 bg-background hover:border-primary hover:bg-primary/5';
}

function timeLabel(instance: TaskInstanceClientDTO): string {
  const formatMinutes = (minutes: number) =>
    formatHHmmParts(Math.floor(minutes / 60), minutes % 60);
  const range = instance.timeConfig?.timeRange;
  if (range && typeof range.start === 'number' && typeof range.end === 'number') {
    return `${formatMinutes(range.start)}–${formatMinutes(range.end)}`;
  }
  if (typeof instance.timeConfig?.timePoint === 'number') {
    return formatMinutes(instance.timeConfig.timePoint);
  }
  return t('task.timeConfig.allDay');
}

function instanceStatusLabel(status: TaskInstanceClientDTO['status']): string {
  return t(`task.instanceStatus.${status.toLowerCase()}`);
}

function goalContext(template: TaskTemplateClientDTO): string | null {
  const binding = template.goalBinding;
  if (!binding) return null;
  const goal = goals.value.find((item) => item.id === String(binding.goalId));
  const keyResult = keyResultsByGoal.value[String(binding.goalId)]?.find(
    (item) => item.id === String(binding.keyResultId),
  );
  const goalName = goal?.title ?? t('task.home.goalLinked');
  return keyResult ? `${goalName} / ${keyResult.title}` : goalName;
}

async function handleComplete(instance: TaskInstanceClientDTO): Promise<void> {
  if (completingId.value || instance.status === 'Skipped' || instance.status === 'Missed') return;
  completingId.value = String(instance.id);
  try {
    if (instance.status === 'Completed') {
      await uncompleteInstance(String(instance.id));
    } else {
      await completeInstance(String(instance.id));
    }
  } finally {
    completingId.value = null;
  }
}

const dialogOpen = ref(false);
const dialogMode = ref<'create'>('create');

function openOccurrence(instanceId: string): void {
  void router.push({ name: 'task-occurrence-detail', params: { id: instanceId } });
}

function openPlans(): void {
  void router.push({ name: 'task-plans' });
}

function openCreate(): void {
  dialogMode.value = 'create';
  dialogOpen.value = true;
}

function closeDialog(): void {
  dialogOpen.value = false;
}

function goalBinding(vm: TaskTemplateViewModel) {
  if (!vm.goalBinding?.goalId || !vm.goalBinding.keyResultId) return null;
  return {
    goalId: vm.goalBinding.goalId as GoalId,
    keyResultId: vm.goalBinding.keyResultId as KeyResultId,
    contribution: vm.goalBinding.contribution ?? null,
  };
}

async function saveTemplate(vm: TaskTemplateViewModel): Promise<void> {
  const result = await createTemplateSafe({
    name: vm.title,
    description: vm.description ?? null,
    timeConfig: toTaskTimeConfigPayload(vm.timeConfig),
    recurrenceRule: (vm.recurrenceRule as unknown as RecurrenceRuleDTO) ?? null,
    importance: (vm.importance as ImportanceLevel) ?? ImportanceLevel.Moderate,
    labelIds: vm.labelIds ?? [],
    checklist: (vm.checklist ?? []).map((item, order) => ({ title: item.title.trim(), order })),
    goalBinding: goalBinding(vm),
    taskType: vm.recurrenceRule ? TaskType.Recurring : TaskType.OneTime,
    reminderConfig: (vm.reminderConfig as unknown as TaskReminderConfigDTO | null) ?? null,
  });
  if (!result) return;
  closeDialog();
  await refreshHome();
}

function handleDatabaseTablesChanged(event: Event): void {
  const detail = (event as CustomEvent<{ modules?: string[] }>).detail;
  if (detail?.modules?.includes('task')) void refreshHome();
}

watch(
  activeView,
  () => {
    void refreshInstances();
  },
  { immediate: true },
);

watch(
  () => templates.value.map((template) => String(template.goalBinding?.goalId ?? '')).join('|'),
  () => {
    void loadGoalBindings(templates.value.map((template) => String(template.goalBinding?.goalId ?? '')));
  },
  { immediate: true },
);

onMounted(() => {
  void loadGoals();
  window.addEventListener('db:tables-changed', handleDatabaseTablesChanged);
});

onUnmounted(() => window.removeEventListener('db:tables-changed', handleDatabaseTablesChanged));
</script>
