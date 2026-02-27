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
        <!-- 任务类型 -->
        <div class="col-span-12 md:col-span-6">
          <Label for="task-type-select">任务类型</Label>
          <Select v-model="taskType">
            <SelectTrigger id="task-type-select" class="mt-1">
              <SelectValue placeholder="选择任务类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ONE_TIME">单次任务</SelectItem>
              <SelectItem value="RECURRING">重复任务</SelectItem>
            </SelectContent>
          </Select>
        </div>

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

        <!-- 颜色 -->
        <div class="col-span-12 md:col-span-6">
          <Label>颜色标记</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="mt-1 w-full justify-start gap-2">
                <div
                  v-if="color"
                  class="h-4 w-4 rounded-full border"
                  :style="{ backgroundColor: color }"
                />
                <div v-else class="h-4 w-4 rounded-full border border-dashed" />
                {{ color || '选择颜色' }}
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-64">
              <div class="grid grid-cols-6 gap-2">
                <button
                  v-for="c in colorSwatches"
                  :key="c"
                  type="button"
                  class="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  :class="
                    color === c ? 'border-primary ring-2 ring-primary/30' : 'border-transparent'
                  "
                  :style="{ backgroundColor: c }"
                  @click="color = c"
                />
              </div>
              <Button
                v-if="color"
                variant="ghost"
                size="sm"
                class="mt-2 w-full"
                @click="color = null"
              >
                清除颜色
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <!-- 文件夹 ID -->
        <div class="col-span-12 md:col-span-6">
          <Label for="folder-id-input">文件夹 ID</Label>
          <Input
            id="folder-id-input"
            :model-value="folderId ?? ''"
            placeholder="可选，输入文件夹 ID"
            class="mt-1"
            @update:model-value="folderId = String($event) || null"
          />
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
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
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

// 任务类型
const taskType = computed({
  get: () => props.modelValue.taskType ?? 'RECURRING',
  set: (value: string) => {
    updateTemplate((template) => {
      template.taskType = value;
    });
  },
});

// 颜色
const colorSwatches = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#f43f5e',
  '#14b8a6',
  '#6366f1',
  '#a855f7',
];

const color = computed({
  get: () => props.modelValue.color ?? null,
  set: (value: string | null) => {
    updateTemplate((template) => {
      template.color = value;
    });
  },
});

// 文件夹
const folderId = computed({
  get: () => props.modelValue.folderId ?? null,
  set: (value: string | null) => {
    updateTemplate((template) => {
      template.folderId = value;
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
