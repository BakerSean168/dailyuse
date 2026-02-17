<template>
  <EditorToolbar
    :saving="saving"
    @insert-text="$emit('insert-text', $event)"
    @wrap-selection="$emit('wrap-selection', $event[0], $event[1])"
    @view-mode-change="$emit('view-mode-change', $event)"
    @save="$emit('save')"
  />
</template>

<script setup lang="ts">
import { EditorToolbar } from '@dailyuse/ui-vue-shadcn';

interface Props {
  saving?: boolean;
}

defineProps<Props>();

defineEmits<{
  'insert-text': [text: string];
  'wrap-selection': [prefix: string, suffix: string];
  'view-mode-change': [mode: 'edit' | 'split' | 'preview'];
  save: [];
}>();
</script>
