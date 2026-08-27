<template>
  <form v-if="modelValue" class="space-y-6" data-testid="task-vnext-editor" @submit.prevent>
    <section class="space-y-4">
      <div class="space-y-2">
        <Label for="task-template-title">{{ t('task.editor.title') }}</Label>
        <Input
          id="task-template-title"
          :model-value="modelValue.title"
          data-testid="task-template-title-input"
          maxlength="100"
          :disabled="readonly"
          :placeholder="t('task.editor.titlePlaceholder')"
          @update:model-value="updateTitle"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-3" data-testid="task-editor-time-fields">
        <DateField
          id="task-editor-date"
          :model-value="timeDraft.date"
          :label="t('task.editor.date')"
          :locale="locale"
          :disabled="readonly"
          :error="timeError === 'date-required' ? t('task.editor.dateRequired') : null"
          @update:model-value="updateTimeDraft('date', $event)"
        />
        <TimeField
          id="task-editor-start-time"
          :model-value="timeDraft.startTime"
          :label="t('task.editor.time')"
          :disabled="readonly"
          :error="timeError === 'end-without-start' ? t('task.editor.startTimeRequired') : null"
          @update:model-value="updateTimeDraft('startTime', $event)"
        />
        <TimeField
          id="task-editor-end-time"
          :model-value="timeDraft.endTime"
          :label="t('task.editor.endTimeOptional')"
          :disabled="readonly"
          :error="timeError === 'end-before-start' ? t('task.timeConfig.endBeforeStart') : null"
          @update:model-value="updateTimeDraft('endTime', $event)"
        />
      </div>
      <p class="text-xs text-muted-foreground">{{ t('task.editor.timeInferenceHint') }}</p>
    </section>

    <section class="space-y-2" data-testid="task-editor-recurrence">
      <Label>{{ t('task.editor.repeat') }}</Label>
      <RecurrenceEditor
        v-model="recurrenceEditorValue"
        id="task-recurrence-editor"
        :disabled="readonly"
        :locale="locale"
        :labels="recurrenceLabels"
      />
      <p v-if="recurrenceError" class="text-xs text-destructive" role="alert">
        {{ recurrenceError }}
      </p>
    </section>

    <section class="space-y-2" data-testid="task-editor-labels">
      <Label>{{ t('task.home.labels') }}</Label>
      <LabelPicker
        :model-value="modelValue.labelIds ?? []"
        :options="labelOptions"
        :disabled="readonly || labelsLoading || labelsCreating"
        :placeholder="t('task.editor.labelsPlaceholder')"
        :search-placeholder="t('task.home.searchLabels')"
        :empty-text="t('task.home.noLabels')"
        :create-label="t('task.editor.createLabel')"
        :aria-label="t('task.home.labels')"
        @update:model-value="updateLabelIds"
        @create="createAndSelectLabel"
      />
      <p v-if="labelCreateError" class="text-xs text-destructive" role="alert">
        {{ labelCreateError }}
      </p>
    </section>

    <KeyResultLinksSection
      :model-value="modelValue"
      :goals="goals"
      :key-results-by-goal="keyResultsByGoal"
      :loading-goals="loadingGoals"
      :loading-key-results="loadingKeyResults"
      :key-result-errors-by-goal="keyResultErrorsByGoal"
      :on-request-key-results="onRequestKeyResults"
      @update:validation="goalBindingValid = $event"
      @update:model-value="emit('update:modelValue', $event)"
    />

    <Collapsible v-model:open="advancedOpen" class="border-t pt-2">
      <CollapsibleTrigger as-child>
        <Button
          type="button"
          variant="ghost"
          class="h-auto w-full justify-between px-0 py-3 text-left"
          data-testid="task-form-advanced-toggle"
          :aria-expanded="advancedOpen"
        >
          <span>
            <span class="block text-sm font-medium">{{ t('task.editor.more') }}</span>
            <span class="block text-xs font-normal text-muted-foreground">{{ t('task.editor.moreHint') }}</span>
          </span>
          <ChevronDown class="h-4 w-4 transition-transform" :class="advancedOpen ? 'rotate-180' : ''" />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent class="space-y-5 pb-1 pt-3">
        <div class="space-y-2">
          <Label for="task-template-description">{{ t('task.basicInfo.description') }}</Label>
          <Textarea
            id="task-template-description"
            :model-value="modelValue.description ?? ''"
            data-testid="task-template-description-input"
            maxlength="1000"
            class="min-h-20 resize-none"
            :disabled="readonly"
            :placeholder="t('task.basicInfo.descPlaceholder')"
            @update:model-value="updateDescription"
          />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <ReminderOffsetField
            :model-value="reminderOffsetMinutes"
            :label="t('task.editor.reminder')"
            :suffix="t('task.editor.minutesBefore')"
            :disabled="readonly"
            @update:model-value="updateReminderOffset"
          />

          <div class="grid gap-1.5">
            <Label for="task-editor-priority">{{ t('task.detail.priority') }}</Label>
            <Select
              :model-value="modelValue.importance ?? ImportanceLevel.Moderate"
              :disabled="readonly"
              @update:model-value="updateImportance"
            >
              <SelectTrigger id="task-editor-priority" data-testid="task-editor-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in priorityOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <section class="space-y-3" data-testid="task-editor-checklist">
          <div>
            <Label>{{ t('task.editor.checklist') }}</Label>
            <p class="mt-1 text-xs text-muted-foreground">{{ t('task.editor.checklistHint') }}</p>
          </div>
          <div v-if="(modelValue.checklist ?? []).length" class="space-y-2">
            <div
              v-for="(item, index) in modelValue.checklist ?? []"
              :key="index"
              class="flex items-center gap-2"
            >
              <Input
                :model-value="item.title"
                :disabled="readonly"
                :aria-label="t('task.editor.checklistItem', { index: index + 1 })"
                maxlength="200"
                @update:model-value="updateChecklistItem(index, String($event))"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                :disabled="readonly"
                :aria-label="t('common.delete')"
                @click="removeChecklistItem(index)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            :disabled="readonly || (modelValue.checklist?.length ?? 0) >= 100"
            data-testid="task-add-checklist-item"
            @click="addChecklistItem"
          >
            <Plus class="mr-1 h-4 w-4" />{{ t('task.editor.addChecklistItem') }}
          </Button>
        </section>
      </CollapsibleContent>
    </Collapsible>
  </form>

  <div v-else class="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
    {{ t('task.templateForm.notFoundMessage') }}
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { ChevronDown, Plus, Trash2 } from '@lucide/vue';
import { useI18n } from 'vue-i18n';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import {
  TaskType,
  type RecurrenceRuleDTO,
  type TaskReminderConfigDTO,
  type TaskTimeConfigDTO,
} from '@memoflow/contracts/task';
import type { Hm, Ymd } from '@memoflow/time';
import type { RecurrenceEditorValue } from '@memoflow/ui-vue-shadcn';
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  DateField,
  Input,
  Label,
  RecurrenceEditor,
  ReminderOffsetField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  TimeField,
} from '@memoflow/ui-vue-shadcn';
import { LabelPicker } from '../../../../shared/components';
import { useLabelCatalog } from '../../../../shared/composables/useLabelCatalog';
import KeyResultLinksSection from './sections/KeyResultLinksSection.vue';
import type { TaskTemplateFormEmits, TaskTemplateFormProps, TaskTemplateViewModel } from '../types';
import {
  recurrenceEditorToRule,
  recurrenceRuleToEditor,
  reminderConfigToOffsetMinutes,
  reminderOffsetMinutesToConfig,
  resolveTaskEditorTime,
  taskTimeConfigToEditor,
  type TaskEditorTimeError,
  type TaskEditorTimeValue,
} from '../../utils/task-editor-adapter';

const props = withDefaults(defineProps<TaskTemplateFormProps>(), {
  modelValue: null,
  isEditMode: false,
  readonly: false,
});
const emit = defineEmits<TaskTemplateFormEmits>();
const { t, locale } = useI18n();
const { options: labelOptions, isLoading: labelsLoading, isCreating: labelsCreating, createLabel } = useLabelCatalog();

const advancedOpen = ref(false);
const goalBindingValid = ref(true);
const labelCreateError = ref<string | null>(null);
const timeError = ref<TaskEditorTimeError | null>(null);
const timeDraft = reactive<TaskEditorTimeValue>({ date: null, startTime: null, endTime: null });

function patchModel(patch: Partial<TaskTemplateViewModel>): void {
  if (!props.modelValue) return;
  emit('update:modelValue', { ...props.modelValue, ...patch });
}

function syncTimeDraft(): void {
  const next = taskTimeConfigToEditor(
    (props.modelValue?.timeConfig ?? null) as TaskTimeConfigDTO | null,
  );
  timeDraft.date = next.date;
  timeDraft.startTime = next.startTime;
  timeDraft.endTime = next.endTime;
  timeError.value = resolveTaskEditorTime(next).error;
}

watch(
  () => props.modelValue?.id,
  () => syncTimeDraft(),
  { immediate: true },
);

function updateTitle(value: string | number): void {
  patchModel({ title: String(value) });
}
function updateDescription(value: string | number): void {
  patchModel({ description: String(value) });
}

function updateTimeDraft(key: keyof TaskEditorTimeValue, value: Ymd | Hm | null): void {
  if (key === 'date') timeDraft.date = value as Ymd | null;
  if (key === 'startTime') timeDraft.startTime = value as Hm | null;
  if (key === 'endTime') timeDraft.endTime = value as Hm | null;
  const resolved = resolveTaskEditorTime(timeDraft);
  timeError.value = resolved.error;
  if (resolved.value) patchModel({ timeConfig: resolved.value });
}

const recurrenceEditorValue = computed<RecurrenceEditorValue | null>({
  get: () =>
    recurrenceRuleToEditor(
      (props.modelValue?.recurrenceRule ?? null) as RecurrenceRuleDTO | null,
    ),
  set: (value) => {
    patchModel({
      recurrenceRule: recurrenceEditorToRule(value),
      taskType: value ? TaskType.Recurring : TaskType.OneTime,
    });
  },
});

const recurrenceError = computed(() => {
  const value = recurrenceEditorValue.value;
  if (!value) return null;
  if (!Number.isInteger(value.interval) || value.interval < 1) return t('task.recurrence.intervalRange');
  if (value.frequency === 'Weekly' && value.daysOfWeek.length === 0) return t('task.recurrence.weekdayRequired');
  if (value.endMode === 'date' && !value.endDate) return t('task.recurrence.selectEndDate');
  if (value.endMode === 'count' && (!value.occurrences || value.occurrences < 1)) return t('task.recurrence.countPositive');
  return null;
});

const recurrenceLabels = computed(() => ({
  enabled: t('task.editor.repeat'),
  frequency: t('task.recurrence.frequency'),
  interval: t('task.recurrence.interval'),
  every: t('task.editor.every'),
  daily: t('task.recurrence.daily'),
  weekly: t('task.recurrence.weekly'),
  monthly: t('task.recurrence.monthly'),
  yearly: t('task.recurrence.yearly'),
  weekdays: [
    t('task.recurrence.sun'), t('task.recurrence.mon'), t('task.recurrence.tue'),
    t('task.recurrence.wed'), t('task.recurrence.thu'), t('task.recurrence.fri'),
    t('task.recurrence.sat'),
  ],
  ends: t('task.recurrence.endCondition'),
  never: t('task.recurrence.never'),
  onDate: t('task.recurrence.endDate'),
  afterCount: t('task.recurrence.countLimit'),
  endDate: t('task.recurrence.endDate'),
  occurrences: t('task.recurrence.count'),
}));

function updateLabelIds(value: string[]): void {
  patchModel({ labelIds: [...new Set(value.filter(Boolean))] });
}
async function createAndSelectLabel(name: string): Promise<void> {
  labelCreateError.value = null;
  try {
    const label = await createLabel(name);
    updateLabelIds([...(props.modelValue?.labelIds ?? []), String(label.id)]);
  } catch (error) {
    labelCreateError.value = error instanceof Error ? error.message : String(error);
  }
}

const reminderOffsetMinutes = computed(() =>
  reminderConfigToOffsetMinutes(
    (props.modelValue?.reminderConfig ?? null) as TaskReminderConfigDTO | null,
  ),
);
function updateReminderOffset(value: number | null): void {
  patchModel({ reminderConfig: reminderOffsetMinutesToConfig(value) });
}

const priorityOptions = computed(() => [
  { value: ImportanceLevel.Vital, label: t('task.metadata.importanceCritical') },
  { value: ImportanceLevel.Important, label: t('task.metadata.importanceHigh') },
  { value: ImportanceLevel.Moderate, label: t('task.metadata.importanceMedium') },
  { value: ImportanceLevel.Minor, label: t('task.metadata.importanceLow') },
  { value: ImportanceLevel.Trivial, label: t('task.metadata.importanceMinimal') },
]);
function updateImportance(value: unknown): void {
  patchModel({ importance: String(value) });
}

function normalizedChecklist(items: Array<{ title: string; order: number }>) {
  return items.map((item, index) => ({ title: item.title, order: index }));
}
function addChecklistItem(): void {
  const items = [...(props.modelValue?.checklist ?? [])];
  items.push({ title: t('task.editor.newChecklistItem'), order: items.length });
  patchModel({ checklist: normalizedChecklist(items) });
}
function updateChecklistItem(index: number, title: string): void {
  const items = [...(props.modelValue?.checklist ?? [])];
  if (!items[index]) return;
  items[index] = { ...items[index], title };
  patchModel({ checklist: normalizedChecklist(items) });
}
function removeChecklistItem(index: number): void {
  const items = [...(props.modelValue?.checklist ?? [])];
  items.splice(index, 1);
  patchModel({ checklist: normalizedChecklist(items) });
}

const checklistValid = computed(() =>
  (props.modelValue?.checklist ?? []).every(
    (item) => item.title.trim().length > 0 && item.title.trim().length <= 200,
  ),
);
const formValid = computed(
  () =>
    Boolean(props.modelValue?.title.trim()) &&
    timeError.value === null &&
    recurrenceError.value === null &&
    goalBindingValid.value &&
    checklistValid.value,
);

watch(formValid, (isValid) => emit('update:validation', { isValid }), { immediate: true });

defineExpose({
  validate: () => formValid.value,
  isValid: formValid,
});
</script>
