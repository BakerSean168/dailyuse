<template>
  <TagInput
    :tags="tags"
    :suggestions="suggestions"
    :label="label"
    :hint="hint"
    @update:tags="$emit('update:tags', $event)"
  />
</template>

<script setup lang="ts">
import { TagInput } from '@dailyuse/ui-vue-shadcn';

withDefaults(
  defineProps<{
    tags: string[];
    suggestions?: string[];
    label?: string;
    hint?: string;
  }>(),
  {
    suggestions: () => [],
    label: '标签',
    hint: '输入后按回车添加标签（自动转换为 kebab-case）',
  },
);

defineEmits<{
  'update:tags': [tags: string[]];
}>();
</script>
