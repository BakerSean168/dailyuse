<!-- widgets/BasicInfoSection.vue -->
<template>
  <Card class="mb-4">
    <CardHeader class="pb-2">
      <CardTitle class="flex items-center text-primary font-semibold">
        <Info class="mr-2 h-5 w-5" />
        {{ t('task.basicInfo.title') }}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <!-- 显示验证错误 -->
      <Alert v-if="Object.keys(validationErrors).length > 0" variant="destructive" class="mb-4">
        <AlertDescription>
          <ul class="mb-0 list-disc pl-4">
            <li v-for="(error, key) in validationErrors" :key="key">{{ error }}</li>
          </ul>
        </AlertDescription>
      </Alert>
      <div class="grid grid-cols-12 gap-4">
        <div class="col-span-12">
          <Label for="task-template-title">{{ t('task.basicInfo.taskTitle') }}</Label>
          <Input
            id="task-template-title"
            v-model="title"
            data-testid="task-template-title-input"
            :placeholder="t('task.basicInfo.titlePlaceholder')"
            maxlength="100"
            class="mt-1"
          />
        </div>

        <div class="col-span-12">
          <Label for="task-template-description">{{ t('task.basicInfo.description') }}</Label>
          <Textarea
            id="task-template-description"
            v-model="description"
            data-testid="task-template-description-input"
            :placeholder="t('task.basicInfo.descPlaceholder')"
            :rows="3"
            maxlength="1000"
            class="mt-1 resize-none"
          />
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Alert,
  AlertDescription,
  Input,
  Textarea,
  Label,
} from '@dailyuse/ui-vue-shadcn';
import { Info } from 'lucide-vue-next';
import { useBasicInfoValidation } from '../../../composables/useBasicInfoValidation';
import type { TaskTemplateViewModel } from '../../types';

const { t } = useI18n();

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
