<template>
  <SearchBar
    :model-value="modelValue"
    :debounce-ms="debounceMs"
    @update:model-value="$emit('update:modelValue', $event)"
    @search="$emit('search', $event)"
  />
</template>

<script setup lang="ts">
import { SearchBar } from '@dailyuse/ui-vue-shadcn';

withDefaults(
  defineProps<{
    modelValue?: string;
    debounceMs?: number;
  }>(),
  {
    modelValue: '',
    debounceMs: 300,
  },
);

defineEmits<{
  'update:modelValue': [value: string];
  search: [query: string];
}>();
</script>
