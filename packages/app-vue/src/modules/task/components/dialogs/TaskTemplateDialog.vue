<template>
  <Dialog :open="visible" @update:open="setVisible">
    <DialogContent class="max-w-[900px] max-h-[85vh] rounded-xl p-0 flex flex-col">
      <DialogHeader class="flex flex-row items-center gap-3 p-6 pb-4 shrink-0">
        <component
          :is="mode === 'edit' ? Pencil : PlusCircle"
          :class="mode === 'edit' ? 'text-primary' : 'text-green-500'"
          class="h-6 w-6 shrink-0"
        />
        <div>
          <DialogTitle class="text-lg">{{
            mode === 'edit'
              ? t('task.templateDialog.editTitle')
              : t('task.templateDialog.createTitle')
          }}</DialogTitle>
          <p class="text-sm text-muted-foreground mt-0">
            {{
              mode === 'edit'
                ? t('task.templateDialog.editSubtitle')
                : t('task.templateDialog.createSubtitle')
            }}
          </p>
        </div>
      </DialogHeader>

      <div class="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
        <TaskTemplateForm
          v-if="localTemplate"
          ref="formRef"
          :model-value="localTemplate"
          :is-edit-mode="mode === 'edit'"
          :readonly="saving"
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from '@dailyuse/ui-vue-shadcn';
import { Pencil, PlusCircle } from 'lucide-vue-next';
import TaskTemplateForm from '../TaskTemplateForm/TaskTemplateForm.vue';
import type { TaskTemplateViewModel } from '../types';

const { t } = useI18n();

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
    taskType: 'RECURRING',
    folderId: null,
    color: null,
  };
}

interface Props {
  modelValue: boolean;
  template?: TaskTemplateViewModel | null;
  mode?: 'create' | 'edit';
  saving?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
  mode: 'create',
  saving: false,
});

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

const visible = computed(() => props.modelValue);
const mode = computed(() => props.mode);
const saving = computed(() => props.saving);
const canSave = computed(() => !!localTemplate.value && isValid.value && !saving.value);

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
