<script setup lang="ts">
import { LinkPreviewPopover } from '@dailyuse/ui-vue-shadcn/repository';

interface PreviewContent {
  type: 'markdown' | 'image' | 'audio' | 'video' | 'pdf' | 'other';
  name: string;
  url?: string;
  excerpt?: string;
  size?: number;
  uuid?: string;
}

interface Props {
  visible: boolean;
  content: PreviewContent | null;
  position: { x: number; y: number };
}

defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'open', content: PreviewContent): void;
  (e: 'copy-link', content: PreviewContent): void;
}>();
</script>

<template>
  <LinkPreviewPopover
    :visible="visible"
    :content="content"
    :position="position"
    @update:visible="emit('update:visible', $event)"
    @open="emit('open', $event)"
    @copy-link="emit('copy-link', $event)"
  />
</template>
