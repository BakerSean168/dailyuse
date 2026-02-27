<template>
  <div class="task-template-form-container">
    <!-- 错误状态显示 - 修复：检查 computed 的 value -->
    <div
      v-if="!taskTemplateBeingEdited"
      class="mb-4 flex items-start gap-3 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-destructive"
    >
      <AlertCircle class="mt-0.5 h-5 w-5 shrink-0" />
      <div class="flex-1">
        <p class="font-semibold">无法加载模板</p>
        <p class="text-sm">没有找到正在编辑的任务模板，请重新选择或创建模板。</p>
      </div>
      <Button variant="ghost" size="sm" @click="handleClose">关闭</Button>
    </div>

    <!-- 正常表单内容 -->
    <form v-else ref="formRef" class="task-template-form" @submit.prevent>
      <!-- 统一使用 @update:model-value 事件 -->
      <BasicInfoSection
        :model-value="taskTemplateBeingEdited!"
        @update:validation="updateBasicValidation"
        @update:model-value="handleTemplateUpdate"
      />

      <TimeConfigSection
        :model-value="taskTemplateBeingEdited!"
        @update:validation="updateTimeValidation"
        @update:model-value="handleTemplateUpdate"
      />

      <RecurrenceSection
        :model-value="taskTemplateBeingEdited!"
        @update:validation="updateRecurrenceValidation"
        @update:model-value="handleTemplateUpdate"
      />

      <ReminderSection
        :model-value="taskTemplateBeingEdited!"
        @update:validation="updateReminderValidation"
        @update:model-value="handleTemplateUpdate"
      />

      <!-- 移除 SchedulingPolicySection，调度配置已经在其他模块中处理 -->

      <KeyResultLinksSection
        :model-value="taskTemplateBeingEdited!"
        @update:model-value="handleTemplateUpdate"
      />

      <MetadataSection
        :model-value="taskTemplateBeingEdited!"
        @update:validation="updateMetadataValidation"
        @update:model-value="handleTemplateUpdate"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { AlertCircle } from 'lucide-vue-next';
import { Button } from '@dailyuse/ui-vue-shadcn';
import BasicInfoSection from './sections/BasicInfoSection.vue';
import TimeConfigSection from './sections/TimeConfigSection.vue';
import RecurrenceSection from './sections/RecurrenceSection.vue';
import ReminderSection from './sections/ReminderSection.vue';
import MetadataSection from './sections/MetadataSection.vue';
import KeyResultLinksSection from './sections/KeyResultLinksSection.vue';
import { useTaskTemplateForm } from '../../composables/useTaskTemplateForm';
import type { TaskTemplateViewModel } from '../types';

// ===== Props 定义 =====
interface Props {
  modelValue?: TaskTemplateViewModel | null;
  isEditMode?: boolean;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  isEditMode: false,
  readonly: false,
});

// ===== Emits 定义 =====
interface Emits {
  'update:modelValue': [value: TaskTemplateViewModel];
  'update:validation': [validation: { isValid: boolean }];
  close: [];
}

const emit = defineEmits<Emits>();

// ===== 响应式数据 =====
const formRef = ref();

const {
  isFormValid,
  validateForm,
  updateBasicValidation,
  updateTimeValidation,
  updateRecurrenceValidation,
  updateReminderValidation,
  updateMetadataValidation,
} = useTaskTemplateForm();

// ===== 计算属性 =====
const taskTemplateBeingEdited = computed(() => props.modelValue);

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
