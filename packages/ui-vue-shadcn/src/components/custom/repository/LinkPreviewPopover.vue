<!--
  LinkPreviewPopover - Link preview popover - shadcn/ui version
-->

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="visible && content"
        class="fixed z-50 w-80 max-h-96 bg-popover border rounded-lg shadow-lg overflow-hidden"
        :style="{ left: `${position.x}px`, top: `${position.y}px` }"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      >
        <!-- Header -->
        <div class="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
          <component :is="getPreviewIcon()" class="w-4 h-4" />
          <span class="text-sm font-medium truncate">{{ displayTitle }}</span>
        </div>

        <!-- Body -->
        <div class="max-h-72 overflow-y-auto p-3">
          <!-- Image -->
          <img
            v-if="content.type === 'image'"
            :src="content.url"
            :alt="content.name"
            class="max-w-full h-auto rounded"
            @error="handleImageError"
          />

          <!-- Markdown -->
          <div v-else-if="content.type === 'markdown'" class="prose prose-sm dark:prose-invert">
            <div v-if="content.excerpt" v-html="renderedExcerpt"></div>
            <div v-else class="flex flex-col items-center justify-center py-6 text-center">
              <FileText class="w-6 h-6 mb-2 text-muted-foreground" />
              <span class="text-xs text-muted-foreground">空笔记</span>
            </div>
          </div>

          <!-- Other -->
          <div v-else class="flex flex-col items-center justify-center py-4 text-center">
            <component :is="getPreviewIcon()" class="w-8 h-8 mb-2 text-muted-foreground" />
            <span class="text-sm font-medium mb-1">{{ content.name }}</span>
            <span v-if="content.size" class="text-xs text-muted-foreground">{{ formatSize(content.size) }}</span>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end gap-2 px-3 py-2 border-t bg-muted/50">
          <Button variant="ghost" size="sm" @click.stop="$emit('open', content)">
            打开
          </Button>
          <Button variant="ghost" size="sm" @click.stop="$emit('copy-link', content)">
            复制链接
          </Button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { marked } from 'marked';
import { FileText, Image as ImageIcon, Music, Video, FileType } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';

interface PreviewContent {
  type: 'markdown' | 'image' | 'audio' | 'video' | 'pdf' | 'other';
  name: string;
  url?: string;
  excerpt?: string;
  size?: number;
  id?: string;
}

interface Props {
  visible: boolean;
  content: PreviewContent | null;
  position: { x: number; y: number };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  open: [content: PreviewContent];
  'copy-link': [content: PreviewContent];
}>();

const isHovering = ref(false);
const imageError = ref(false);

const displayTitle = computed(() => {
  const name = props.content?.name || '';
  return name.replace(/\.[^/.]+$/, '');
});

const renderedExcerpt = computed(() => {
  if (!props.content?.excerpt) return '';
  try {
    const excerpt = props.content.excerpt.slice(0, 500);
    return marked(excerpt);
  } catch {
    return props.content.excerpt;
  }
});

function getPreviewIcon() {
  const type = props.content?.type || 'other';
  const iconMap = {
    markdown: FileText,
    image: ImageIcon,
    audio: Music,
    video: Video,
    pdf: FileType,
    other: FileType,
  };
  return iconMap[type] || FileType;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function handleMouseEnter() {
  isHovering.value = true;
}

function handleMouseLeave() {
  isHovering.value = false;
  setTimeout(() => {
    if (!isHovering.value) {
      emit('update:visible', false);
    }
  }, 100);
}

function handleImageError() {
  imageError.value = true;
}
</script>
