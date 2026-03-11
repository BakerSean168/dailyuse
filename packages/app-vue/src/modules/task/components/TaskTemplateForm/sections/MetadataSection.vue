<template>
  <Card class="mb-4">
    <CardHeader class="pb-2">
      <CardTitle class="flex items-center text-primary font-semibold">
        <Info class="mr-2 h-5 w-5" />
        {{ t('task.metadata.title') }}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-12 gap-4">
        <!-- 任务类型 -->
        <div class="col-span-12 md:col-span-6">
          <Label for="task-type-select">{{ t('task.metadata.taskType') }}</Label>
          <Select v-model="taskType">
            <SelectTrigger id="task-type-select" class="mt-1">
              <SelectValue :placeholder="t('task.metadata.selectType')" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value="TaskType.OneTime">{{ t('task.metadata.oneTime') }}</SelectItem>
              <SelectItem :value="TaskType.Recurring">{{
                t('task.metadata.recurring')
              }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- 重要性 -->
        <div class="col-span-12 md:col-span-6">
          <Label for="importance-select">{{ t('task.metadata.importance') }}</Label>
          <Select v-model="importance">
            <SelectTrigger id="importance-select" class="mt-1">
              <SelectValue :placeholder="t('task.metadata.selectImportance')" />
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
          <Label>{{ t('task.metadata.colorMark') }}</Label>
          <Popover>
            <PopoverTrigger as-child>
              <Button variant="outline" class="mt-1 w-full justify-start gap-2">
                <div
                  v-if="color"
                  class="h-4 w-4 rounded-full border"
                  :style="{ backgroundColor: color }"
                />
                <div v-else class="h-4 w-4 rounded-full border border-dashed" />
                {{ color || t('task.metadata.selectColor') }}
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
                {{ t('task.metadata.clearColor') }}
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <!-- 任务标签 (Story 2.3: 占满整行，因为紧急性已移除) -->
        <div class="col-span-12">
          <Label for="tags-input">{{ t('task.metadata.tags') }}</Label>
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
              :placeholder="t('task.metadata.tagPlaceholder')"
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
import { TaskType } from '@dailyuse/contracts/task';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  modelValue: TaskTemplateViewModel;
}>();
const emit = defineEmits<{
  'update:modelValue': [value: TaskTemplateViewModel];
  'update:validation': [isValid: boolean];
}>();

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
const importanceOptions = computed(() => [
  {
    title: t('task.metadata.importanceCritical'),
    value: ImportanceLevel.Vital,
    subtitle: t('task.metadata.importanceCriticalSub'),
  },
  {
    title: t('task.metadata.importanceHigh'),
    value: ImportanceLevel.Important,
    subtitle: t('task.metadata.importanceHighSub'),
  },
  {
    title: t('task.metadata.importanceMedium'),
    value: ImportanceLevel.Moderate,
    subtitle: t('task.metadata.importanceMediumSub'),
  },
  {
    title: t('task.metadata.importanceLow'),
    value: ImportanceLevel.Minor,
    subtitle: t('task.metadata.importanceLowSub'),
  },
  {
    title: t('task.metadata.importanceMinimal'),
    value: ImportanceLevel.Trivial,
    subtitle: t('task.metadata.importanceMinimalSub'),
  },
]);

// 标签建议
const tagSuggestions = computed(() => [
  t('task.metadata.tagWork'),
  t('task.metadata.tagPersonal'),
  t('task.metadata.tagStudy'),
  t('task.metadata.tagHealth'),
  t('task.metadata.tagFinance'),
  t('task.metadata.tagSocial'),
  t('task.metadata.tagCreative'),
  t('task.metadata.tagTravel'),
  t('task.metadata.tagHome'),
  t('task.metadata.tagShopping'),
  t('task.metadata.tagExercise'),
  t('task.metadata.tagReading'),
  t('task.metadata.tagMeeting'),
  t('task.metadata.tagDeadline'),
  t('task.metadata.tagUrgent'),
  t('task.metadata.tagReview'),
]);

const filteredSuggestions = computed(() =>
  tagSuggestions.value.filter((s) => !tags.value.includes(s)),
);

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
  get: () => props.modelValue.taskType ?? TaskType.Recurring,
  set: (value: TaskType) => {
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
  tags.value = tags.value.filter((item) => item !== tag);
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
