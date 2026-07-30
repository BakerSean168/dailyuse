<template>
  <Dialog :open="visible" @update:open="setVisible">
    <DialogContent
      data-testid="task-template-dialog"
      class="max-w-[900px] max-h-[85vh] rounded-xl p-0 flex min-h-0 flex-col overflow-hidden"
    >
      <DialogHeader class="flex flex-row items-center gap-3 p-6 pb-4 shrink-0">
        <component
          :is="mode === 'edit' ? Pencil : mode === 'copy' ? Copy : PlusCircle"
          :class="mode === 'edit' ? 'text-primary' : 'text-success'"
          class="h-6 w-6 shrink-0"
        />
        <div>
          <DialogTitle class="text-lg">{{
            mode === 'edit'
              ? t('task.templateDialog.editTitle')
              : mode === 'copy'
                ? t('task.templateDialog.copyTitle')
                : t('task.templateDialog.createTitle')
          }}</DialogTitle>
          <DialogDescription class="mt-0 text-sm text-muted-foreground">
            {{
              mode === 'edit'
                ? t('task.templateDialog.editSubtitle')
                : mode === 'copy'
                  ? t('task.templateDialog.copySubtitle')
                  : t('task.templateDialog.createSubtitle')
            }}
          </DialogDescription>
        </div>
      </DialogHeader>

      <p
        v-if="mode === 'edit' && (localTemplate?.futurePendingInstanceCount ?? 0) > 0"
        class="mx-6 mb-3 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-foreground"
        role="status"
        data-testid="task-plan-update-impact"
      >
        {{
          t('task.templateDialog.updateImpact', {
            count: localTemplate?.futurePendingInstanceCount ?? 0,
          })
        }}
      </p>

      <div class="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
        <TaskTemplateForm
          v-if="localTemplate"
          ref="formRef"
          :model-value="localTemplate"
          :is-edit-mode="mode === 'edit'"
          :readonly="saving"
          :available-parent-tasks="availableParentTasks"
          :goals="goalOptions"
          :key-results-by-goal="keyResultsByGoal"
          :loading-goals="loadingGoals"
          :loading-key-results="loadingKeyResults"
          :key-result-errors-by-goal="keyResultErrorsByGoal"
          :on-request-key-results="requestKeyResults"
          @update:model-value="handleTemplateUpdate"
          @update:validation="handleValidationUpdate"
          @close="handleCancel"
        />

        <DependencyManager
          v-if="showDependencyManager"
          class="mt-4"
          :current-task-id="localTemplate?.id"
          :all-tasks="graphTasks"
          :dependencies="dependencies"
          @dependency-added="handleDependencyAdded"
          @dependency-deleted="handleDependencyDeleted"
        />
      </div>

      <DialogFooter class="p-6 pt-4 shrink-0 border-t">
        <Button variant="ghost" :disabled="saving" @click="handleCancel">{{
          t('task.templateDialog.cancel')
        }}</Button>
        <Button
          data-testid="task-dialog-save-button"
          :disabled="!canSave"
          :loading="saving"
          @click="handleSave"
        >
          {{
            mode === 'edit' ? t('task.templateDialog.saveChanges') : t('task.templateDialog.create')
          }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, toRaw, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from '@memoflow/ui-vue-shadcn';
import { Copy, Pencil, PlusCircle } from '@lucide/vue';
import TaskTemplateForm from '../TaskTemplateForm/TaskTemplateForm.vue';
import DependencyManager from '../dependency/DependencyManager.vue';
import type { TaskTemplateViewModel } from '../types';
import type { TaskForDAG } from '../../types/task-dag.types';
import {
  TaskType,
  type DependencyType,
  type TaskGraphDependencyDTO,
} from '@memoflow/contracts/task';
import { defaultNamedColor } from '../../../../shared/constants/color-palette';
import { useTaskGoalBindingOptions } from '../../composables/useTaskGoalBindingOptions';

const { t } = useI18n();
const {
  goals: goalOptions,
  keyResultsByGoal,
  loadingGoals,
  loadingKeyResults,
  keyResultErrorsByGoal,
  loadGoals: loadGoalOptions,
  loadKeyResults: loadGoalKeyResults,
  clearErrors: clearGoalBindingErrors,
} = useTaskGoalBindingOptions();

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
    parentTaskId: null,
    color: defaultNamedColor,
  };
}

function cloneTemplate(template: TaskTemplateViewModel): TaskTemplateViewModel {
  return structuredClone(toCloneableData(template));
}

function toCloneableData<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => toCloneableData(item)) as T;
  }

  if (value !== null && typeof value === 'object') {
    const rawValue = toRaw(value);
    return Object.fromEntries(
      Object.entries(rawValue).map(([key, item]) => [key, toCloneableData(item)]),
    ) as T;
  }

  return value;
}

function createEditDraft(template: TaskTemplateViewModel | null): TaskTemplateViewModel | null {
  return template ? cloneTemplate(template) : null;
}

function createCopyDraft(template: TaskTemplateViewModel | null): TaskTemplateViewModel | null {
  if (!template) {
    return null;
  }

  return {
    ...cloneTemplate(template),
    id: '',
    status: 'ACTIVE',
    isActive: true,
    isPaused: false,
    isArchived: false,
    instanceCount: 0,
    completedInstanceCount: 0,
    pendingInstanceCount: 0,
    completionRate: 0,
    formattedCreatedAt: undefined,
  };
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    template?: TaskTemplateViewModel | null;
    mode?: 'create' | 'edit' | 'copy';
    saving?: boolean;
    availableTemplates?: TaskTemplateViewModel[];
    graphTasks?: TaskForDAG[];
    dependencies?: TaskGraphDependencyDTO[];
    onCreateDependency?: (dependency: {
      predecessorTaskId: string;
      successorTaskId: string;
      dependencyType: DependencyType;
    }) => Promise<boolean> | boolean;
    onDeleteDependency?: (dependencyId: string) => Promise<boolean> | boolean;
  }>(),
  {
    template: null,
    mode: 'create',
    saving: false,
    availableTemplates: () => [],
    graphTasks: () => [],
    dependencies: () => [],
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', value: TaskTemplateViewModel): void;
  (e: 'cancel'): void;
  (e: 'dirty-change', dirty: boolean): void;
}>();

const formRef = ref<InstanceType<typeof TaskTemplateForm> | null>(null);
const localTemplate = ref<TaskTemplateViewModel | null>(null);
const draftBaseline = ref<string | null>(null);
const isValid = ref(false);
const visible = computed(() => props.modelValue);
const mode = computed(() => props.mode);
const saving = computed(() => props.saving);
const canSave = computed(() => !!localTemplate.value && isValid.value && !saving.value);
const graphTasks = computed(() => props.graphTasks ?? []);
const dependencies = computed(() => props.dependencies ?? []);
const showDependencyManager = computed(
  () =>
    mode.value === 'edit' &&
    !!localTemplate.value?.id &&
    graphTasks.value.length > 0 &&
    !!props.onCreateDependency &&
    !!props.onDeleteDependency,
);

const availableParentTasks = computed(() => {
  const currentId = localTemplate.value?.id;
  if (!currentId) {
    return (props.availableTemplates ?? []).map((template) => ({
      id: template.id,
      title: template.title,
    }));
  }

  const childrenByParent = new Map<string, string[]>();
  graphTasks.value.forEach((task) => {
    if (!task.parentTaskId) {
      return;
    }

    const children = childrenByParent.get(task.parentTaskId) ?? [];
    children.push(task.id);
    childrenByParent.set(task.parentTaskId, children);
  });

  const blockedIds = new Set<string>([currentId]);
  const stack = [...(childrenByParent.get(currentId) ?? [])];

  while (stack.length > 0) {
    const taskId = stack.pop()!;
    if (blockedIds.has(taskId)) {
      continue;
    }

    blockedIds.add(taskId);
    stack.push(...(childrenByParent.get(taskId) ?? []));
  }

  return (props.availableTemplates ?? [])
    .filter((template) => !blockedIds.has(template.id))
    .map((template) => ({
      id: template.id,
      title: template.title,
    }));
});

async function loadGoals() {
  await loadGoalOptions();
}

async function requestKeyResults(goalId: string, force = false) {
  return loadGoalKeyResults(goalId, force);
}

function initializeDraft(): void {
  if (props.mode === 'create') {
    localTemplate.value = createBlankTemplate();
  } else if (props.mode === 'copy') {
    localTemplate.value = createCopyDraft(props.template ?? null);
  } else {
    localTemplate.value = createEditDraft(props.template ?? null);
  }

  isValid.value = false;
  clearGoalBindingErrors();
  draftBaseline.value = JSON.stringify(localTemplate.value);
  emit('dirty-change', false);
}

watch(
  localTemplate,
  (draft) => {
    if (!visible.value || draftBaseline.value === null) return;
    emit('dirty-change', JSON.stringify(draft) !== draftBaseline.value);
  },
  { deep: true },
);

watch(
  visible,
  async (open, wasOpen) => {
    if (!open) {
      draftBaseline.value = null;
      emit('dirty-change', false);
      return;
    }

    if (!wasOpen) {
      initializeDraft();
    }
    await loadGoals();
  },
  { immediate: true },
);

watch(
  [() => props.mode, () => props.template?.id],
  ([nextMode, nextTemplateId], [previousMode, previousTemplateId]) => {
    if (visible.value && (nextMode !== previousMode || nextTemplateId !== previousTemplateId)) {
      initializeDraft();
    }
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
  localTemplate.value = null;
  draftBaseline.value = null;
  isValid.value = false;
  clearGoalBindingErrors();
  emit('dirty-change', false);
  emit('cancel');
  emit('update:modelValue', false);
};

const handleSave = () => {
  if (!localTemplate.value || !canSave.value) return;
  emit('save', localTemplate.value);
};

const handleDependencyAdded = async (dependency: {
  predecessorTaskId: string;
  successorTaskId: string;
  dependencyType: DependencyType;
}) => {
  await props.onCreateDependency?.(dependency);
};

const handleDependencyDeleted = async (dependencyId: string) => {
  await props.onDeleteDependency?.(dependencyId);
};
</script>
