<template>
  <div class="task-template-form-container">
    <!-- 错误状态显示 - 修复：检查 computed 的 value -->
    <div
      v-if="!taskTemplateBeingEdited"
      class="mb-4 flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive"
    >
      <AlertCircle class="mt-0.5 h-5 w-5 shrink-0" />
      <div class="flex-1">
        <p class="font-semibold">{{ t('task.templateForm.loadError') }}</p>
        <p class="text-sm">{{ t('task.templateForm.notFoundMessage') }}</p>
      </div>
      <Button variant="ghost" size="sm" @click="handleClose">{{
        t('task.templateForm.close')
      }}</Button>
    </div>

    <!-- 正常表单内容 -->
    <form v-else ref="formRef" class="task-template-form space-y-5" @submit.prevent>
      <div class="grid items-start gap-5 lg:grid-cols-2">
        <BasicInfoSection
          :model-value="taskTemplateBeingEdited!"
          @update:validation="updateBasicValidation"
          @update:model-value="handleTemplateUpdate"
        />

        <TimeConfigSection
          :model-value="taskTemplateBeingEdited!"
          :is-edit-mode="isEditMode"
          @update:validation="updateTimeValidation"
          @update:model-value="handleTemplateUpdate"
        />
      </div>

      <div class="grid items-start gap-5 border-t pt-5 lg:grid-cols-2">
        <RecurrenceSection
          :model-value="taskTemplateBeingEdited!"
          @update:validation="updateRecurrenceValidation"
          @update:model-value="handleTemplateUpdate"
        />

        <KeyResultLinksSection
          :model-value="taskTemplateBeingEdited!"
          :goals="goals"
          :key-results-by-goal="keyResultsByGoal"
          :loading-goals="props.loadingGoals"
          :loading-key-results="props.loadingKeyResults"
          :key-result-errors-by-goal="props.keyResultErrorsByGoal"
          :on-request-key-results="props.onRequestKeyResults"
          @update:validation="updateGoalBindingValidation"
          @update:model-value="handleTemplateUpdate"
        />
      </div>

      <Collapsible v-model:open="advancedOpen" class="border-t pt-2">
        <CollapsibleTrigger as-child>
          <Button
            type="button"
            variant="ghost"
            class="h-auto w-full justify-between px-0 py-3 text-left"
            data-testid="task-form-advanced-toggle"
            :aria-expanded="advancedOpen"
          >
            <span class="flex min-w-0 items-center gap-3">
              <Settings2 class="h-4 w-4 shrink-0" />
              <span class="min-w-0">
                <span class="block text-sm font-medium">{{
                  t('task.templateForm.advancedSettings')
                }}</span>
                <span class="block text-xs font-normal text-muted-foreground">{{
                  t('task.templateForm.advancedSettingsDescription')
                }}</span>
              </span>
            </span>
            <ChevronDown
              class="h-4 w-4 shrink-0 transition-transform"
              :class="{ 'rotate-180': advancedOpen }"
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent class="grid items-start gap-5 pb-1 pt-3 lg:grid-cols-2">
          <ReminderSection
            :model-value="taskTemplateBeingEdited!"
            @update:validation="updateReminderValidation"
            @update:model-value="handleTemplateUpdate"
          />

          <MetadataSection
            :model-value="taskTemplateBeingEdited!"
            @update:validation="updateMetadataValidation"
            @update:model-value="handleTemplateUpdate"
          />
        </CollapsibleContent>
      </Collapsible>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { AlertCircle, ChevronDown, Settings2 } from '@lucide/vue';
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@memoflow/ui-vue-shadcn';
import { useI18n } from 'vue-i18n';
import BasicInfoSection from './sections/BasicInfoSection.vue';
import TimeConfigSection from './sections/TimeConfigSection.vue';
import RecurrenceSection from './sections/RecurrenceSection.vue';
import ReminderSection from './sections/ReminderSection.vue';
import MetadataSection from './sections/MetadataSection.vue';
import KeyResultLinksSection from './sections/KeyResultLinksSection.vue';
import { useTaskTemplateForm } from '../../composables/useTaskTemplateForm';
import type { TaskTemplateFormEmits, TaskTemplateFormProps, TaskTemplateViewModel } from '../types';

const { t } = useI18n();

const props = withDefaults(defineProps<TaskTemplateFormProps>(), {
  modelValue: null,
  isEditMode: false,
  readonly: false,
});

const emit = defineEmits<TaskTemplateFormEmits>();

// ===== 响应式数据 =====
const formRef = ref();
const advancedOpen = ref(false);

const {
  isFormValid,
  validateForm,
  updateBasicValidation,
  updateTimeValidation,
  updateRecurrenceValidation,
  updateReminderValidation,
  updateGoalBindingValidation,
  updateMetadataValidation,
} = useTaskTemplateForm();

// ===== 计算属性 =====
const taskTemplateBeingEdited = computed(() => props.modelValue);
const goals = computed(() => props.goals ?? []);
const keyResultsByGoal = computed(() => props.keyResultsByGoal ?? {});

// ===== 方法 =====
const handleTemplateUpdate = (updatedTemplate: TaskTemplateViewModel): void => {
  emit('update:modelValue', updatedTemplate);
};

const handleClose = (): void => {
  emit('close');
};

// ===== 监听器 =====
// 监听验证状态变化，通知父组件
watch(
  isFormValid,
  (newValue) => {
    emit('update:validation', { isValid: newValue });
  },
  { immediate: true },
);

// ===== 暴露给父组件的方法 =====
defineExpose({
  validate: validateForm,
  isValid: isFormValid,
  formRef,
});
</script>
