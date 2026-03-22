<template>
  <Dialog :open="visible" @update:open="setVisible">
    <DialogContent
      class="max-w-[900px] max-h-[85vh] rounded-xl p-0 flex min-h-0 flex-col overflow-hidden"
    >
      <DialogHeader class="flex flex-row items-center gap-3 p-6 pb-4 shrink-0">
        <component
          :is="mode === 'edit' ? Pencil : PlusCircle"
          :class="mode === 'edit' ? 'text-primary' : 'text-success'"
          class="h-6 w-6 shrink-0"
        />
        <div>
          <DialogTitle class="text-lg">{{
            mode === 'edit'
              ? t('task.templateDialog.editTitle')
              : t('task.templateDialog.createTitle')
          }}</DialogTitle>
          <DialogDescription class="mt-0 text-sm text-muted-foreground">
            {{
              mode === 'edit'
                ? t('task.templateDialog.editSubtitle')
                : t('task.templateDialog.createSubtitle')
            }}
          </DialogDescription>
        </div>
      </DialogHeader>

      <div class="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
        <TaskTemplateForm
          v-if="localTemplate"
          ref="formRef"
          :model-value="localTemplate"
          :is-edit-mode="mode === 'edit'"
          :readonly="saving"
          :goals="goalOptions"
          :key-results-by-goal="keyResultsByGoal"
          :on-request-key-results="requestKeyResults"
          @update:model-value="handleTemplateUpdate"
          @update:validation="handleValidationUpdate"
          @close="handleCancel"
        />
      </div>

      <DialogFooter class="p-6 pt-4 shrink-0 border-t">
        <Button variant="ghost" :disabled="saving" @click="handleCancel">{{
          t('task.templateDialog.cancel')
        }}</Button>
        <Button :disabled="!canSave" :loading="saving" @click="handleSave">
          {{
            mode === 'edit' ? t('task.templateDialog.saveChanges') : t('task.templateDialog.create')
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from '@dailyuse/ui-vue-shadcn';
import { Pencil, PlusCircle } from 'lucide-vue-next';
import TaskTemplateForm from '../TaskTemplateForm/TaskTemplateForm.vue';
import type {
  GoalBindingOption,
  KeyResultBindingOption,
  TaskTemplateViewModel,
} from '../types';
import { TaskType } from '@dailyuse/contracts/task';
import { defaultNamedColor } from '../../../../shared/constants/colorPalette';
import { GOAL_SERVICE_KEY } from '../../../../di/keys';
import { useStrictInject } from '../../../../shared/utils/useStrictInject';

const { t } = useI18n();
const goalService = useStrictInject(GOAL_SERVICE_KEY, 'GoalService');

function createBlankTemplate(): TaskTemplateViewModel {
  return {
    id: '',
    title: '',
    description: '',
    status: 'ACTIVE',
    isActive: true,
    isPaused: false,
    isArchived: false,
    importance: 'Moderate',
    priority: 0,
    tags: [],
    goalBinding: null,
    timeConfig: {
      timeType: 'AllDay',
      timePoint: null,
      timeRange: null,
      startDate: Date.now(),
    },
    recurrenceRule: null,
    reminderConfig: null,
    instanceCount: 0,
    completionRate: 0,
    taskType: TaskType.Recurring,
    color: defaultNamedColor,
  };
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    template?: TaskTemplateViewModel | null;
    mode?: 'create' | 'edit';
    saving?: boolean;
  }>(),
  {
    template: null,
    mode: 'create',
    saving: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', value: TaskTemplateViewModel): void;
  (e: 'cancel'): void;
}>();

const formRef = ref<InstanceType<typeof TaskTemplateForm> | null>(null);
const localTemplate = ref<TaskTemplateViewModel | null>(
  props.template ? { ...props.template } : props.mode === 'create' ? createBlankTemplate() : null,
);
const isValid = ref(false);
const goalOptions = ref<GoalBindingOption[]>([]);
const keyResultsByGoal = ref<Record<string, KeyResultBindingOption[]>>({});
const goalsLoaded = ref(false);

const visible = computed(() => props.modelValue);
const mode = computed(() => props.mode);
const saving = computed(() => props.saving);
const canSave = computed(() => !!localTemplate.value && isValid.value && !saving.value);

function mapGoalOption(goal: any): GoalBindingOption {
  return {
    id: String(goal.id),
    title: goal.name,
    description: goal.description ?? undefined,
    status: goal.status,
  };
}

function mapKeyResultOption(keyResult: any): KeyResultBindingOption {
  const progress = keyResult.progress ?? {};

  return {
    id: String(keyResult.id),
    title: keyResult.title,
    weight: Number(keyResult.weight ?? 0),
    progress: {
      current: Number(progress.currentValue ?? 0),
      target: Number(progress.targetValue ?? 0),
      percentage: Number(progress.progressPercentage ?? 0),
    },
  };
}

async function loadGoals() {
  if (goalsLoaded.value) {
    return;
  }

  const result = await goalService.listGoals({
    page: 1,
    pageSize: 200,
    systemView: 'active',
  });

  if (!result.ok) {
    goalOptions.value = [];
    return;
  }

  goalOptions.value = result.data.goals.map((goal: any) => mapGoalOption(goal.toDTO()));
  goalsLoaded.value = true;
}

async function requestKeyResults(goalId: string): Promise<KeyResultBindingOption[]> {
  const cached = keyResultsByGoal.value[goalId];
  if (cached) {
    return cached;
  }

  const result = await goalService.getKeyResults(goalId);
  if (!result.ok) {
    keyResultsByGoal.value = {
      ...keyResultsByGoal.value,
      [goalId]: [],
    };
    return [];
  }

  const mapped = result.data.keyResults.map((keyResult: any) =>
    mapKeyResultOption(keyResult.toDTO()),
  );
  keyResultsByGoal.value = {
    ...keyResultsByGoal.value,
    [goalId]: mapped,
  };
  return mapped;
}

async function ensureBindingKeyResults(template: TaskTemplateViewModel | null) {
  const goalId = template?.goalBinding?.goalId;
  if (!goalId) {
    return;
  }

  await requestKeyResults(goalId);
}

watch(
  () => props.template,
  (template) => {
    localTemplate.value = template
      ? { ...template }
      : props.mode === 'create'
        ? createBlankTemplate()
        : null;
  },
  { immediate: true, deep: true },
);

watch(
  visible,
  async (open) => {
    if (!open) {
      return;
    }

    await loadGoals();
    await ensureBindingKeyResults(localTemplate.value);
  },
  { immediate: true },
);

watch(
  () => localTemplate.value?.goalBinding?.goalId,
  async (goalId) => {
    if (!goalId) {
      return;
    }

    await requestKeyResults(goalId);
  },
);

const setVisible = (value: boolean) => {
  emit('update:modelValue', value);
};

const handleTemplateUpdate = (value: TaskTemplateViewModel) => {
  localTemplate.value = value;
};

const handleValidationUpdate = (validation: { isValid: boolean }) => {
  isValid.value = validation.isValid;
};

const handleCancel = () => {
  emit('cancel');
  emit('update:modelValue', false);
};

const handleSave = () => {
  if (!localTemplate.value || !canSave.value) return;
  emit('save', localTemplate.value);
};
</script>
