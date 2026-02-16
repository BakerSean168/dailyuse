<template>
  <v-dialog :model-value="visible" max-width="900" persistent scrollable @update:model-value="setVisible">
    <v-card class="task-template-dialog">
      <v-card-title class="dialog-header d-flex align-center">
        <v-icon :color="mode === 'edit' ? 'primary' : 'success'" class="mr-3" size="24">
          {{ mode === 'edit' ? 'mdi-pencil' : 'mdi-plus-circle' }}
        </v-icon>
        <div>
          <h3 class="text-h6">{{ mode === 'edit' ? '编辑任务模板' : '创建任务模板' }}</h3>
          <p class="text-caption text-medium-emphasis ma-0">
            {{ mode === 'edit' ? '修改现有任务模板配置' : '填写模板信息并保存' }}
          </p>
        </div>
      </v-card-title>

      <v-card-text class="dialog-content pa-0">
        <div class="form-container pa-4">
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
      </v-card-text>

      <v-card-actions class="dialog-actions">
        <v-spacer />
        <v-btn variant="text" :disabled="saving" @click="handleCancel">取消</v-btn>
        <v-btn color="primary" variant="elevated" :disabled="!canSave" :loading="saving" @click="handleSave">
          {{ mode === 'edit' ? '保存更改' : '创建模板' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import TaskTemplateForm from '../TaskTemplateForm/TaskTemplateForm.vue';
import type { TaskTemplateViewModel } from '../types';

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
const localTemplate = ref<TaskTemplateViewModel | null>(props.template ? { ...props.template } : null);
const isValid = ref(false);

const visible = computed(() => props.modelValue);
const mode = computed(() => props.mode);
const saving = computed(() => props.saving);
const canSave = computed(() => !!localTemplate.value && isValid.value && !saving.value);

watch(
  () => props.template,
  (template) => {
    localTemplate.value = template ? { ...template } : null;
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

<style scoped>
.task-template-dialog {
  border-radius: 12px;
}
</style>
