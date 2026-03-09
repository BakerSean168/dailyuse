<template>
  <div class="flex w-full h-full relative overflow-hidden">
    <div v-if="showEditor" class="editor-pane h-full overflow-auto" :style="editorStyle">
      <slot name="editor"></slot>
    </div>

    <div v-if="showEditor && showPreview" class="divider-container" @mousedown="startResize">
      <Separator orientation="vertical" class="h-full" />
      <div
        class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-10 bg-border rounded-full"
      ></div>
    </div>

    <div v-if="showPreview" class="preview-pane h-full overflow-auto" :style="previewStyle">
      <slot name="preview"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Separator } from '@dailyuse/ui-vue-shadcn';

const props = withDefaults(
  defineProps<{
    viewMode?: 'edit' | 'preview' | 'split';
    initialSplitPosition?: number;
  }>(),
  {
    viewMode: 'split',
    initialSplitPosition: 50,
  },
);

const emit = defineEmits<{
  'split-position-change': [position: number];
}>();

const splitPosition = ref(props.initialSplitPosition);
const isResizing = ref(false);

const showEditor = computed(() => {
  return props.viewMode === 'edit' || props.viewMode === 'split';
});

const showPreview = computed(() => {
  return props.viewMode === 'preview' || props.viewMode === 'split';
});

const editorStyle = computed(() => {
  if (props.viewMode === 'edit') return { width: '100%' };
  if (props.viewMode === 'split') return { width: `${splitPosition.value}%` };
  return {};
});

const previewStyle = computed(() => {
  if (props.viewMode === 'preview') return { width: '100%' };
  if (props.viewMode === 'split') return { width: `${100 - splitPosition.value}%` };
  return {};
});

function startResize(e: MouseEvent) {
  isResizing.value = true;
  e.preventDefault();
  document.body.style.cursor = 'col-resize';
}

function onMouseMove(e: MouseEvent) {
  if (!isResizing.value) return;

  const container = document.querySelector('.flex.w-full.h-full') as HTMLElement;
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const newPosition = ((e.clientX - containerRect.left) / containerRect.width) * 100;

  splitPosition.value = Math.max(20, Math.min(80, newPosition));
  emit('split-position-change', splitPosition.value);
}

function onMouseUp() {
  isResizing.value = false;
  document.body.style.cursor = '';
}

onMounted(() => {
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
});

onUnmounted(() => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
});
</script>

<style scoped>
.editor-pane {
  border-right: 1px solid hsl(var(--border));
}

.divider-container {
  position: relative;
  width: 0.5rem;
  background-color: hsl(var(--muted) / 0.5);
  cursor: col-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  transition-property: color, background-color;
  transition-duration: 150ms;
  flex-shrink: 0;
}

.divider-container:hover {
  background-color: hsl(var(--muted));
}
</style>
