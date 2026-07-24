<template>
  <div class="rounded-2xl border border-border/60 bg-muted/20 p-4">
    <div v-if="hasDraft" class="space-y-5">
      <div class="grid gap-2">
        <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.goalDraft.draftName') }}
        </p>
        <Input
          :model-value="goal.name"
          :placeholder="t('goal.dialog.goalTitlePlaceholder')"
          @update:model-value="updateGoalField('name', String($event ?? ''))"
        />
        <Textarea
          :model-value="goal.description"
          :placeholder="t('goal.dialog.descriptionPlaceholder')"
          class="min-h-28"
          @update:model-value="updateGoalField('description', String($event ?? ''))"
        />
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-border/50 bg-background/70 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('goal.dialog.category') }}
          </p>
          <Select
            :model-value="goal.category"
            @update:model-value="updateGoalField('category', String($event ?? ''))"
          >
            <SelectTrigger class="mt-2">
              <SelectValue :placeholder="t('goal.dialog.categoryPlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in categoryOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="rounded-xl border border-border/50 bg-background/70 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('goal.dialog.importance') }}
          </p>
          <Select
            :model-value="goal.importance"
            @update:model-value="updateGoalField('importance', $event as GoalDraftState['importance'])"
          >
            <SelectTrigger class="mt-2">
              <SelectValue :placeholder="t('goal.dialog.importancePlaceholder')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in importanceOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-border/50 bg-background/70 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('goal.dialog.startDate') }}
          </p>
          <Input
            class="mt-2"
            type="date"
            :model-value="toDateInputValue(goal.startDate)"
            @update:model-value="updateGoalField('startDate', fromDateInputValue($event))"
          />
        </div>

        <div class="rounded-xl border border-border/50 bg-background/70 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('goal.dialog.targetDate') }}
          </p>
          <Input
            class="mt-2"
            type="date"
            :model-value="toDateInputValue(goal.targetDate)"
            @update:model-value="updateGoalField('targetDate', fromDateInputValue($event))"
          />
        </div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-xl border border-border/50 bg-background/70 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('goal.dialog.motivation') }}
          </p>
          <Textarea
            class="mt-2 min-h-24"
            :model-value="goal.motivation"
            :placeholder="t('goal.dialog.motivationPlaceholder')"
            @update:model-value="updateGoalField('motivation', String($event ?? ''))"
          />
        </div>

        <div class="rounded-xl border border-border/50 bg-background/70 p-3">
          <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {{ t('goal.dialog.feasibilityAnalysis') }}
          </p>
          <Textarea
            class="mt-2 min-h-24"
            :model-value="goal.feasibilityAnalysis"
            :placeholder="t('goal.dialog.feasibilityPlaceholder')"
            @update:model-value="updateGoalField('feasibilityAnalysis', String($event ?? ''))"
          />
        </div>
      </div>

      <div class="rounded-xl border border-border/50 bg-background/70 p-3">
        <TagInput
          :tags="goal.tags"
          :label="t('goal.dialog.tags')"
          :hint="t('goal.dialog.tagsHint')"
          :placeholder="t('goal.dialog.tagsPlaceholder')"
          @update:tags="updateGoalField('tags', $event)"
        />
      </div>

      <div v-if="keyResults.length" class="space-y-3">
        <p class="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {{ t('aiAssistant.goalDraft.keyResults') }}
        </p>
        <div
          v-for="(item, index) in keyResults"
          :key="`${item.title}-${index}`"
          class="space-y-3 rounded-xl border border-border/50 bg-background/70 p-3"
        >
          <div class="grid gap-2">
            <Input
              :model-value="item.title"
              :placeholder="t('goal.krDialog.namePlaceholder')"
              @update:model-value="
                updateKeyResult(index, { title: String($event ?? '') })
              "
            />
            <Textarea
              :model-value="item.description"
              :placeholder="t('goal.krDialog.descPlaceholder')"
              class="min-h-20"
              @update:model-value="
                updateKeyResult(index, { description: String($event ?? '') })
              "
            />
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="grid gap-2">
              <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {{ t('goal.krDialog.valueType') }}
              </p>
              <Select
                :model-value="item.valueType"
                @update:model-value="
                  updateKeyResult(index, {
                    valueType: $event as KeyResultDraftState['valueType'],
                  })
                "
              >
                <SelectTrigger>
                  <SelectValue :placeholder="t('goal.krDialog.selectValueType')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in valueTypeOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="grid gap-2">
              <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {{ t('goal.krDialog.calcMethod') }}
              </p>
              <Select
                :model-value="item.calculationMethod"
                @update:model-value="
                  updateKeyResult(index, {
                    calculationMethod: $event as KeyResultDraftState['calculationMethod'],
                  })
                "
              >
                <SelectTrigger>
                  <SelectValue :placeholder="t('goal.krDialog.selectCalcMethod')" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in calculationMethodOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div class="grid gap-2">
              <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {{ t('goal.krDialog.startValue') }}
              </p>
              <Input
                type="number"
                :model-value="String(item.startValue)"
                @update:model-value="
                  updateKeyResult(index, { startValue: toNumber($event, item.startValue) })
                "
              />
            </div>

            <div class="grid gap-2">
              <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {{ t('goal.krDialog.currentValue') }}
              </p>
              <Input
                type="number"
                :model-value="String(item.currentValue)"
                @update:model-value="
                  updateKeyResult(index, { currentValue: toNumber($event, item.currentValue) })
                "
              />
            </div>

            <div class="grid gap-2">
              <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {{ t('goal.krDialog.targetValue') }}
              </p>
              <Input
                type="number"
                :model-value="String(item.targetValue)"
                @update:model-value="
                  updateKeyResult(index, { targetValue: toNumber($event, item.targetValue) })
                "
              />
            </div>

            <div class="grid gap-2">
              <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {{ t('goal.krDialog.weight') }}
              </p>
              <Input
                type="number"
                min="1"
                max="5"
                step="1"
                :model-value="String(item.weight)"
                @update:model-value="
                  updateKeyResult(index, {
                    weight: clampWeight(toNumber($event, item.weight)),
                  })
                "
              />
            </div>

            <div class="grid gap-2">
              <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                {{ t('aiAssistant.goalDraft.unit') }}
              </p>
              <Input
                :model-value="item.unit"
                :placeholder="t('aiAssistant.goalDraft.unit')"
                @update:model-value="updateKeyResult(index, { unit: String($event ?? '') })"
              />
            </div>
          </div>

          <Button variant="outline" @click="$emit('remove-key-result', index)">
            {{ t('aiAssistant.goalDraft.removeKeyResult') }}
          </Button>
        </div>
      </div>

      <Button variant="outline" class="w-full" @click="$emit('add-key-result')">
        {{ t('aiAssistant.goalDraft.addKeyResult') }}
      </Button>

      <Button
        v-if="showConfirmAction"
        class="w-full"
        :disabled="isSubmitting || !goal.name.trim()"
        @click="$emit('confirm')"
      >
        {{
          isSubmitting
            ? t('aiAssistant.goalDraft.creatingGoal')
            : t('aiAssistant.goalDraft.createGoal')
        }}
      </Button>
    </div>

    <div
      v-else
      class="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-border/60 bg-background/50 p-6 text-center text-sm text-muted-foreground"
    >
      {{ t('aiAssistant.goalDraft.emptyState') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  KeyResultCalculationMethod,
  KeyResultValueType,
  type AddKeyResultReq,
  type CreateGoalReq,
} from '@dailyuse/contracts/goal';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TagInput,
  Textarea,
} from '@dailyuse/ui-vue-shadcn';

type GoalDraftState = {
  name: string;
  description: string;
  category: string;
  importance: CreateGoalReq['importance'];
  motivation: string;
  feasibilityAnalysis: string;
  tags: string[];
  startDate: number | null;
  targetDate: number | null;
};

type KeyResultDraftState = {
  title: string;
  description: string;
  valueType: AddKeyResultReq['valueType'];
  calculationMethod: AddKeyResultReq['calculationMethod'];
  startValue: number;
  currentValue: number;
  targetValue: number;
  unit: string;
  weight: number;
};

const emit = defineEmits<{
  confirm: [];
  'add-key-result': [];
  'remove-key-result': [index: number];
  'update-goal': [payload: GoalDraftState];
  'update-key-result': [payload: { index: number; value: KeyResultDraftState }];
}>();

const props = defineProps<{
  goal: GoalDraftState;
  keyResults: KeyResultDraftState[];
  isSubmitting: boolean;
  showConfirmAction?: boolean;
}>();

const { t } = useI18n();

const hasDraft = computed(() =>
  Boolean(props.goal.name || props.goal.description || props.keyResults.length),
);

const showConfirmAction = computed(() => props.showConfirmAction !== false);

const categoryOptions = computed(() => [
  { value: 'product', label: t('aiAssistant.goalDraft.categories.product') },
  { value: 'engineering', label: t('aiAssistant.goalDraft.categories.engineering') },
  { value: 'marketing', label: t('aiAssistant.goalDraft.categories.marketing') },
  { value: 'work', label: t('aiAssistant.goalDraft.categories.work') },
  { value: 'personal', label: t('aiAssistant.goalDraft.categories.personal') },
  { value: 'health', label: t('aiAssistant.goalDraft.categories.health') },
  { value: 'finance', label: t('aiAssistant.goalDraft.categories.finance') },
  { value: 'learning', label: t('aiAssistant.goalDraft.categories.learning') },
  { value: 'relationship', label: t('aiAssistant.goalDraft.categories.relationship') },
  { value: 'other', label: t('aiAssistant.goalDraft.categories.other') },
]);

const importanceOptions = computed(() => [
  { value: 'Vital', label: t('goal.dialog.importanceVital') },
  { value: 'Important', label: t('goal.dialog.importanceImportant') },
  { value: 'Moderate', label: t('goal.dialog.importanceModerate') },
  { value: 'Minor', label: t('goal.dialog.importanceMinor') },
  { value: 'Trivial', label: t('goal.dialog.importanceTrivial') },
]);

const valueTypeOptions = computed(() => [
  { value: KeyResultValueType.Incremental, label: t('goal.krDialog.valueTypeIncremental') },
  { value: KeyResultValueType.Absolute, label: t('goal.krDialog.valueTypeAbsolute') },
  { value: KeyResultValueType.Percentage, label: t('goal.krDialog.valueTypePercentage') },
  { value: KeyResultValueType.Binary, label: t('goal.krDialog.valueTypeBinary') },
]);

const calculationMethodOptions = computed(() => [
  { value: KeyResultCalculationMethod.Sum, label: t('goal.krDialog.calcCumulative') },
  { value: KeyResultCalculationMethod.Average, label: t('goal.krDialog.calcAverage') },
  { value: KeyResultCalculationMethod.Max, label: t('goal.krDialog.calcMax') },
  { value: KeyResultCalculationMethod.Min, label: t('goal.krDialog.calcMin') },
  { value: KeyResultCalculationMethod.Last, label: t('goal.krDialog.calcLatest') },
]);

function updateGoalField<K extends keyof GoalDraftState>(key: K, value: GoalDraftState[K]) {
  emit('update-goal', {
    ...props.goal,
    [key]: value,
  });
}

function updateKeyResult(
  index: number,
  patch: Partial<KeyResultDraftState>,
) {
  emit('update-key-result', {
    index,
    value: {
      ...props.keyResults[index],
      ...patch,
    },
  });
}

/**
 * Residual 1228 keep-boundary: app-vue AI goal toDateInputValue — epoch → local calendar YMD.
 * Offset-normalized then toISOString().slice(0, 10); falsy → ''.
 * Soft residual 1228: app-react GoalEditor pure UTC ISO slice differs (no force-merge).
 */
function toDateInputValue(value: number | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const normalized = new Date(date.getTime() - offset * 60 * 1000);
  return normalized.toISOString().slice(0, 10);
}

function fromDateInputValue(value: unknown): number | null {
  if (typeof value !== 'string' || !value) {
    return null;
  }

  const parsed = Date.parse(`${value}T00:00:00`);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNumber(value: unknown, fallback: number): number {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : Number.NaN;

  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampWeight(value: number): number {
  const normalized = Math.round(value);
  if (!Number.isFinite(normalized)) {
    return 1;
  }

  return Math.min(5, Math.max(1, normalized));
}
</script>
