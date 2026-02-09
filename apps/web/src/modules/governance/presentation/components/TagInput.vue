<template>
  <v-combobox
    v-model="modelValue"
    :items="suggestions"
    :label="label"
    multiple
    chips
    closable-chips
    clearable
    hide-details="auto"
    :hint="hint"
    persistent-hint
    @update:model-value="onUpdate"
  >
    <template #chip="{ item, props: chipProps }">
      <v-chip
        v-bind="chipProps"
        size="small"
        color="info"
        label
        closable
      >
        {{ normalizeTag(item.title) }}
      </v-chip>
    </template>
  </v-combobox>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = withDefaults(
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

const emit = defineEmits<{
  'update:tags': [tags: string[]];
}>();

const modelValue = ref<string[]>([...props.tags]);

watch(
  () => props.tags,
  (newTags) => {
    modelValue.value = [...newTags];
  },
);

function normalizeTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

function onUpdate(value: string[]) {
  const normalized = value.map(normalizeTag).filter(Boolean);
  const unique = [...new Set(normalized)];
  modelValue.value = unique;
  emit('update:tags', unique);
}
</script>
