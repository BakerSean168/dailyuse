<template>
  <v-card class="mb-4" elevation="0" variant="outlined">
    <v-card-title class="section-title">
      <v-icon class="mr-2">mdi-information-outline</v-icon>
      任务属性
    </v-card-title>
    <v-card-text>
      <v-row>
        <!-- 重要性 -->
        <v-col cols="12" md="6">
          <v-select v-model="importance" label="重要性" :items="importanceOptions" item-title="title" item-value="value"
            variant="outlined" required />
        </v-col>

        <!-- 任务标签 (Story 2.3: 占满整行，因为紧急性已移除) -->
        <v-col cols="12">
          <v-combobox v-model="tags" label="任务标签" variant="outlined" multiple chips closable-chips
            :items="tagSuggestions" prepend-inner-icon="mdi-tag-multiple-outline" hint="按回车键添加新标签" persistent-hint />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { TaskTemplateViewModel } from '../../types';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

interface Props {
  modelValue: TaskTemplateViewModel;
}

interface Emits {
  (e: 'update:modelValue', value: TaskTemplateViewModel): void;
  (e: 'update:validation', isValid: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const updateTemplate = (updater: (template: TaskTemplateViewModel) => void) => {
  const updatedTemplate: TaskTemplateViewModel = {
    ...props.modelValue,
    tags: [...(props.modelValue.tags || [])],
    timeConfig: { ...(props.modelValue.timeConfig || {}) },
  };
  updater(updatedTemplate);
  emit('update:modelValue', updatedTemplate);
};

// 重要性选项
const importanceOptions = [
  {
    title: '极其重要',
    value: ImportanceLevel.Vital,
    subtitle: '对生活/工作有重大影响，如健康检查、家人重要日子',
  },
  {
    title: '非常重要',
    value: ImportanceLevel.Important,
    subtitle: '对目标实现很关键，如职业发展相关任务',
  },
  {
    title: '中等重要',
    value: ImportanceLevel.Moderate,
    subtitle: '值得做但不是关键，如技能提升、社交活动',
  },
  { title: '不太重要', value: ImportanceLevel.Minor, subtitle: '可做可不做，如日常琐事' },
  { title: '无关紧要', value: ImportanceLevel.Trivial, subtitle: '纯粹消遣，如游戏娱乐' },
];

// 标签建议
const tagSuggestions = [
  '重要',
  '紧急',
  '例行',
  '学习',
  '工作',
  '会议',
  '运动',
  '阅读',
  '编程',
  '设计',
  '写作',
  '思考',
  '计划',
  '回顾',
  '沟通',
  '创作',
];

// 重要性
const importance = computed({
  get: () => props.modelValue.importance,
  set: (value: ImportanceLevel) => {
    updateTemplate((template) => {
      template.importance = value;
    });
  },
});

// 标签
const tags = computed({
  get: () => props.modelValue.tags || [],
  set: (value: string[]) => {
    updateTemplate((template) => {
      template.tags = value;
    });
  },
});

// Story 2.3: 简化验证 - 仅检查 importance（紧急性已移除）
const isValid = computed(() => {
  return Boolean(importance.value);
});

// 监听验证状态变化 - Story 2.3: 仅监听 importance
watch(
  () => importance.value,
  () => {
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

