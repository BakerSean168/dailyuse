<template>
  <Card class="mb-4">
    <CardHeader class="pb-2">
      <CardTitle class="flex items-center text-primary font-semibold">
        <Info class="mr-2 h-5 w-5" />
        任务属性
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-12 gap-4">
        <!-- 重要性 -->
        <div class="col-span-12 md:col-span-6">
          <Label for="importance-select">重要性</Label>
          <Select v-model="importance">
            <SelectTrigger id="importance-select" class="mt-1">
              <SelectValue placeholder="选择重要性" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in importanceOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.title }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 任务标签 (Story 2.3: 占满整行，因为紧急性已移除) -->
        <div class="col-span-12">
          <Label for="tags-input">任务标签</Label>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <Badge v-for="tag in tags" :key="tag" variant="secondary" class="gap-1">
              {{ tag }}
              <button class="ml-1 hover:text-destructive" @click="removeTag(tag)">
                <X class="h-3 w-3" />
              </button>
            </Badge>
            <Input
              id="tags-input"
              v-model="tagInput"
              placeholder="按回车键添加新标签"
              class="flex-1 min-w-[150px]"
              @keydown.enter.prevent="addTag"
            />
          </div>
          <div v-if="tagSuggestions.length" class="mt-2 flex flex-wrap gap-1">
            <Badge
              v-for="suggestion in filteredSuggestions"
              :key="suggestion"
              variant="outline"
              class="cursor-pointer"
              @click="addSuggestion(suggestion)"
            >
              {{ suggestion }}
            </Badge>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Input,
} from '@dailyuse/ui-vue-shadcn';
import { Info, X } from 'lucide-vue-next';
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

const tagInput = ref('');

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

const filteredSuggestions = computed(() => tagSuggestions.filter((s) => !tags.value.includes(s)));

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

const addTag = () => {
  const value = tagInput.value.trim();
  if (value && !tags.value.includes(value)) {
    tags.value = [...tags.value, value];
  }
  tagInput.value = '';
};

const removeTag = (tag: string) => {
  tags.value = tags.value.filter((t) => t !== tag);
};

const addSuggestion = (suggestion: string) => {
  if (!tags.value.includes(suggestion)) {
    tags.value = [...tags.value, suggestion];
  }
};

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
