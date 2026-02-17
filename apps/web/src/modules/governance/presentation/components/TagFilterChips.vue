<template>
  <TagFilterChips
    :tags="tags"
    :selected-tags="selectedTags"
    @toggle="$emit('toggle', $event)"
    @clear="$emit('clear')"
  />
</template>

<script setup lang="ts">
import { TagFilterChips } from '@dailyuse/ui-vue-shadcn';

defineProps<{
  tags: string[];
  selectedTags: string[];
}>();

defineEmits<{
  toggle: [tag: string];
  clear: [];
}>();
</script>
