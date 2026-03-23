<template>
  <div class="flex h-full w-full overflow-hidden bg-background">
    <div v-if="showEditor" class="h-full w-full overflow-auto">
      <slot name="editor"></slot>
    </div>
    <div v-else class="h-full w-full overflow-auto">
      <slot name="preview"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    viewMode?: 'source' | 'live' | 'preview';
  }>(),
  {
    viewMode: 'live',
  },
);

const showEditor = computed(() => props.viewMode !== 'preview');
</script>
