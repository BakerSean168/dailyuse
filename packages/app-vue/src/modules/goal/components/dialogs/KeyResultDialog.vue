<template>
  <Dialog :open="open" @update:open="setOpen">
    <ProductDialogShell
      :open="open"
      test-id="key-result-dialog"
      size="md"
      initial-focus-selector="[data-testid='key-result-title-input']"
    >
      <template #title>
        {{ editing ? t('goal.krDialog.editTitle') : t('goal.krDialog.createTitle') }}
      </template>
      <template #description>
        {{ t('goal.krDialog.descriptionText') }}
      </template>

      <form id="kr-form" class="space-y-4" @submit.prevent="submit">
        <div
          v-if="submitError"
          role="alert"
          class="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {{ submitError }}
        </div>

        <div class="space-y-2">
          <Label for="key-result-title">{{ t('goal.krDialog.name') }}</Label>
          <Input
            id="key-result-title"
            v-model="draft.title"
            data-testid="key-result-title-input"
            maxlength="256"
          />
        </div>

        <div class="space-y-2">
          <Label for="key-result-description">{{ t('goal.dialog.description') }}</Label>
          <Textarea id="key-result-description" v-model="draft.description" maxlength="2000" />
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-2">
            <Label>{{ t('goal.krDialog.calcMethod') }}</Label>
            <Select v-model="draft.calculationMethod">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="method in methods" :key="method" :value="method">
                  {{ method }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="key-result-unit">{{ t('goal.krDialog.unit') }}</Label>
            <Input id="key-result-unit" v-model="draft.unit" maxlength="50" />
          </div>
          <div class="space-y-2">
            <Label for="key-result-starting">Starting</Label>
            <Input id="key-result-starting" v-model.number="draft.startingValue" type="number" />
          </div>
          <div class="space-y-2">
            <Label for="key-result-current">Current</Label>
            <Input id="key-result-current" v-model.number="draft.currentValue" type="number" />
          </div>
          <div class="space-y-2">
            <Label for="key-result-target">Target</Label>
            <Input id="key-result-target" v-model.number="draft.targetValue" type="number" />
          </div>
          <div class="space-y-2">
            <Label for="key-result-baseline">Progress baseline</Label>
            <Input
              id="key-result-baseline"
              v-model="draft.progressBaselineValue"
              type="number"
              placeholder="optional"
            />
          </div>
          <div class="space-y-2">
            <Label for="key-result-weight">{{ t('goal.krDialog.weight') }}</Label>
            <Input id="key-result-weight" v-model.number="draft.weight" type="number" min="1" max="5" />
          </div>
        </div>
      </form>

      <template #footer>
        <Button variant="ghost" :disabled="isSubmitting" @click="setOpen(false)">
          {{ t('common.cancel') }}
        </Button>
        <Button
          type="submit"
          form="kr-form"
          data-testid="save-key-result-button"
          :disabled="!draft.title.trim() || isSubmitting"
        >
          {{ t('common.save') }}
        </Button>
      </template>
    </ProductDialogShell>
  </Dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  KeyResultCalculationMethod,
  type AddKeyResultReq,
  type KeyResultClientDTO,
} from '@memoflow/contracts/goal';
import {
  Button,
  Dialog,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@memoflow/ui-vue-shadcn';
import { ProductDialogShell } from '../../../../shared/components';

type KeyResultInput = Omit<AddKeyResultReq, 'goalId' | 'expectedVersion'>;

const props = defineProps<{
  onSubmit: (payload: {
    goalId: string;
    keyResult: KeyResultInput;
    isEditing: boolean;
    keyResultId?: string;
  }) => Promise<boolean> | boolean;
}>();

const { t } = useI18n();
const open = ref(false);
const editing = ref(false);
const goalId = ref('');
const keyResultId = ref<string>();
const isSubmitting = ref(false);
const submitError = ref<string | null>(null);
const methods = Object.values(KeyResultCalculationMethod);
const draft = reactive({
  title: '',
  description: '',
  calculationMethod: KeyResultCalculationMethod.Sum as KeyResultInput['calculationMethod'],
  startingValue: 0,
  currentValue: 0,
  targetValue: 100,
  progressBaselineValue: '' as number | '',
  unit: '',
  weight: 3,
});

function reset(): void {
  draft.title = '';
  draft.description = '';
  draft.calculationMethod = KeyResultCalculationMethod.Sum;
  draft.startingValue = 0;
  draft.currentValue = 0;
  draft.targetValue = 100;
  draft.progressBaselineValue = '';
  draft.unit = '';
  draft.weight = 3;
  submitError.value = null;
  isSubmitting.value = false;
}

function openForCreateKeyResult(id: string): void {
  reset();
  goalId.value = id;
  keyResultId.value = undefined;
  editing.value = false;
  open.value = true;
}

function openForUpdateKeyResult(id: string, keyResult: KeyResultClientDTO): void {
  reset();
  goalId.value = id;
  keyResultId.value = String(keyResult.id);
  editing.value = true;
  draft.title = keyResult.title;
  draft.description = keyResult.description ?? '';
  draft.calculationMethod = keyResult.progress.aggregationMethod;
  draft.startingValue = keyResult.progress.startingValue;
  draft.currentValue = keyResult.progress.currentValue;
  draft.targetValue = keyResult.progress.targetValue;
  draft.progressBaselineValue = keyResult.progress.progressBaselineValue ?? '';
  draft.unit = keyResult.progress.unit ?? '';
  draft.weight = keyResult.weight;
  open.value = true;
}

function setOpen(value: boolean): void {
  if (!value && isSubmitting.value) return;
  open.value = value;
  if (!value) submitError.value = null;
}

async function submit(): Promise<void> {
  if (!draft.title.trim() || isSubmitting.value) return;

  const keyResult: KeyResultInput = {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    calculationMethod: draft.calculationMethod,
    startingValue: Number(draft.startingValue),
    currentValue: Number(draft.currentValue),
    targetValue: Number(draft.targetValue),
    progressBaselineValue:
      draft.progressBaselineValue === '' ? null : Number(draft.progressBaselineValue),
    unit: draft.unit.trim() || null,
    weight: Math.max(1, Math.min(5, Math.round(Number(draft.weight)))),
  };

  isSubmitting.value = true;
  submitError.value = null;
  try {
    const saved = await props.onSubmit({
      goalId: goalId.value,
      keyResult,
      isEditing: editing.value,
      keyResultId: keyResultId.value,
    });
    if (saved) {
      open.value = false;
      return;
    }
    submitError.value = t('common.operationFailed');
  } catch (error) {
    submitError.value = error instanceof Error && error.message ? error.message : t('common.operationFailed');
  } finally {
    isSubmitting.value = false;
  }
}

defineExpose({ openForCreateKeyResult, openForUpdateKeyResult });
</script>
