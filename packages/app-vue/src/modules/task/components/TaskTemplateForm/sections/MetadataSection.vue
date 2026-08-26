<template>
  <section class="space-y-4" aria-labelledby="task-metadata-heading">
    <header>
      <h3 id="task-metadata-heading" class="flex items-center text-sm font-semibold">
        <Info class="mr-2 h-5 w-5" />
        {{ t('task.metadata.title') }}
      </h3>
    </header>
    <div>
      <div class="grid grid-cols-12 gap-4">
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
          <Label id="task-color-label">{{ t('task.metadata.colorMark') }}</Label>
          <ColorPickerField
            class="mt-1"
            :aria-label="t('task.metadata.colorMark')"
            :model-value="color"
            :empty-label="t('task.metadata.selectColor')"
            :clear-label="t('task.metadata.clearColor')"
            @update:model-value="(value) => (color = value ?? defaultNamedColor)"
          />
        </div>



        <!-- 任务标签 (Story 2.3: 占满整行，因为紧急性已移除) -->
        <div class="col-span-12">
          <Label for="tags-input">{{ t('task.metadata.tags') }}</Label>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <Badge v-for="tag in tags" :key="tag" variant="secondary" class="gap-1">
              {{ tag }}
              <button
                type="button"
                class="ml-1 hover:text-destructive"
                :aria-label="`${t('common.delete')} ${tag}`"
                @click="removeTag(tag)"
              >
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
            <Button
              v-for="suggestion in filteredSuggestions"
              :key="suggestion"
              variant="outline"
              size="sm"
              class="h-8 rounded-full"
              @click="addSuggestion(suggestion)"
            >
              {{ suggestion }}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  Label,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
  Input,
} from '@memoflow/ui-vue-shadcn';
import { Info, X } from '@lucide/vue';
import type { TaskTemplateViewModel } from '../../types';
import { ImportanceLevel } from '@memoflow/contracts/shared';
import { useI18n } from 'vue-i18n';
import { ColorPickerField } from '../../../../../shared/components';
import { defaultNamedColor } from '../../../../../shared/constants/color-palette';

const { t } = useI18n();

const props = defineProps<{ modelValue: TaskTemplateViewModel }>();
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

const color = computed({
  get: () => props.modelValue.color ?? defaultNamedColor,
  set: (value: string | null) => {
    updateTemplate((template) => {
      template.color = value ?? defaultNamedColor;
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
