<script setup lang="ts">
import { BookmarksPanel } from '@dailyuse/ui-vue-shadcn/repository';
import type { Bookmark } from '@dailyuse/contracts/repository';

// Re-export with store integration
defineProps<{
  repositoryUuid?: string;
}>();

const emit = defineEmits<{
  select: [bookmark: Bookmark];
}>();
</script>

<template>
  <BookmarksPanel
    :bookmarks="[]"
    @select="emit('select', $event)"
    @rename="() => {}"
    @move-up="() => {}"
    @move-down="() => {}"
    @remove="() => {}"
  />
</template>
