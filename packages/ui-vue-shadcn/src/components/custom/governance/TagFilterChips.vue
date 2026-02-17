<template>
  <div class="flex flex-wrap gap-1.5">
    <button
      v-for="tag in tags"
      :key="tag"
      class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
      :class="[
        isSelected(tag)
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ]"
      @click="$emit('toggle', tag)"
    >
      {{ tag }}
    </button>

    <button
      v-if="selectedTags.length > 0"
      class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      @click="$emit('clear')"
    >
      <X :size="12" />
      清除
    </button>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next';

const props = defineProps<{
  tags: string[];
  selectedTags: string[];
}>();

defineEmits<{
  toggle: [tag: string];
  clear: [];
}>();

function isSelected(tag: string): boolean {
  return props.selectedTags.includes(tag);
}
</script>
