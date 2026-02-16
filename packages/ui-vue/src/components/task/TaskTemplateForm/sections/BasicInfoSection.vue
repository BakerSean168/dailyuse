<!-- widgets/BasicInfoSection.vue -->
<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-information-outline</v-icon>
      基础信息
    </v-card-title>
    <v-card-text>
      <!-- 显示验证错误 -->
      <v-alert v-if="validationErrors.length > 0" type="error" variant="tonal" class="mb-4">
        <ul class="mb-0">
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </v-alert>
      <v-row>
        <v-col cols="12">
          <v-text-field v-model="title" data-testid="task-template-title-input" label="任务标题" placeholder="请输入任务标题"
            variant="outlined" required counter="100" />
        </v-col>

        <v-col cols="12">
          <v-textarea v-model="description" data-testid="task-template-description-input" label="任务描述"
            placeholder="请输入任务描述（可选）" variant="outlined" rows="3" counter="1000" no-resize />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useBasicInfoValidation } from '../../../composables/useBasicInfoValidation';
import type { TaskTemplateViewModel } from '../../types';
interface Props {
  modelValue: TaskTemplateViewModel;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplateViewModel): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const { validate, validationErrors, isValid } = useBasicInfoValidation();

const updateTemplate = (updater: (template: TaskTemplateViewModel) => void) => {
  const updatedTemplate: TaskTemplateViewModel = {
    ...props.modelValue,
    timeConfig: { ...(props.modelValue.timeConfig || {}) },
    tags: [...(props.modelValue.tags || [])],
    goalBinding: props.modelValue.goalBinding ? { ...props.modelValue.goalBinding } : null,
  };
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

const title = computed({
  get: () => props.modelValue.title,
  set: (value: string) => {
    updateTemplate((template) => {
      template.title = value;
    });
  },
});

const description = computed({
  get: () => props.modelValue.description,
  set: (value: string) => {
    updateTemplate((template) => {
      template.description = value || '';
    });
  },
});

watch(
  [title, description],
  () => {
    validate(title.value, description.value || '');
    emit('update:validation', isValid.value);
  },
  { immediate: true },
);
</script>

<style scoped>
.section-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}
</style>
