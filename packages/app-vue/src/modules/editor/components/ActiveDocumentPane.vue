<template>
  <div class="flex h-full flex-col">
    <EditorToolbar
      :saving="saving"
      :view-mode="viewMode"
      @insert-text="emit('insert-text', $event)"
      @insert-resource="emit('insert-resource')"
      @insert-existing-image="emit('insert-existing-image')"
      @export-self-contained="emit('export-self-contained')"
      @wrap-selection="handleWrapSelection"
      @view-mode-change="emit('view-mode-change', $event)"
      @save="emit('save')"
    />

    <!-- 编辑/预览切换（EditorSplitView 已退役内联，Plan §9-10 阶段 0） -->
    <div class="flex-1 overflow-hidden bg-background">
      <div v-if="viewMode !== 'preview'" class="relative h-full overflow-auto">
        <MarkdownEditor
          ref="markdownEditorRef"
          :model-value="content"
          :view-mode="viewMode"
          :placeholder="placeholder"
          @update:model-value="emit('update:content', $event)"
          @change="emit('change', $event)"
          @link-click="emit('link-click', $event)"
          @paste-files="handlePasteFiles"
          @trigger-suggestion="emit('trigger-suggestion', $event)"
          @close-suggestion="emit('close-suggestion')"
        />
        <slot name="editor-overlay" />
      </div>
      <div v-else class="h-full overflow-auto">
        <EditorPreview
          :content="content"
          :broken-resource-references="brokenResourceReferences"
          @link-click="emit('link-click', $event)"
        />
      </div>
    </div>

    <div class="border-t p-4">
      <BrokenResourceDiagnostics :diagnostics="diagnostics" @repair="emit('repair', $event)" />
    </div>

    <div
      class="flex items-center justify-end gap-3 border-t px-4 py-1 text-xs text-muted-foreground"
    >
      <span v-if="saving" class="flex items-center gap-1 text-warning">
        <Loader2 class="h-3 w-3 animate-spin" />
        {{ savingLabel }}
      </span>
      <span v-else-if="dirty" class="text-muted-foreground">{{ unsavedLabel }}</span>
      <span v-else class="text-success">{{ savedLabel }}</span>
      <span class="text-muted-foreground">{{ charCount }} {{ charsLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Loader2 } from 'lucide-vue-next';
import MarkdownEditor from './MarkdownEditor.vue';
import BrokenResourceDiagnostics from './BrokenResourceDiagnostics.vue';
import EditorToolbar from './EditorToolbar.vue';
import EditorPreview from './EditorPreview.vue';
import type { ResourceReferenceUsage } from '../utils/resource-reference-index';
import type { ResolvedMarkdownResourceReference } from '../utils/markdown-resource-references';
import type { EditorSelectionRange } from '../composables/useResourceInsertion';

defineProps<{
  content: string;
  saving: boolean;
  dirty: boolean;
  viewMode: 'source' | 'live' | 'preview';
  placeholder: string;
  diagnostics: ResourceReferenceUsage[];
  brokenResourceReferences: ResolvedMarkdownResourceReference[];
  charCount: number;
  savingLabel: string;
  unsavedLabel: string;
  savedLabel: string;
  charsLabel: string;
}>();

const emit = defineEmits<{
  'update:content': [value: string];
  change: [value: string];
  'insert-text': [text: string];
  'insert-resource': [];
  'insert-existing-image': [];
  'export-self-contained': [];
  'wrap-selection': [prefix: string, suffix: string];
  'view-mode-change': [mode: 'source' | 'live' | 'preview'];
  save: [];
  'paste-files': [files: File[], selection: EditorSelectionRange];
  'link-click': [title: string];
  repair: [reference: ResolvedMarkdownResourceReference];
  'trigger-suggestion': [payload: { x: number; y: number; query: string }];
  'close-suggestion': [];
}>();

const markdownEditorRef = ref<InstanceType<typeof MarkdownEditor> | null>(null);

function handleWrapSelection(prefix: string, suffix: string) {
  emit('wrap-selection', prefix, suffix);
}

function handlePasteFiles(files: File[], selection: EditorSelectionRange) {
  emit('paste-files', files, selection);
}

defineExpose({
  insertText: (text: string) => markdownEditorRef.value?.insertText(text),
  insertTextAtSelection: (text: string, selection?: EditorSelectionRange) =>
    markdownEditorRef.value?.insertTextAtSelection(text, selection),
  wrapSelection: (prefix: string, suffix: string) =>
    markdownEditorRef.value?.wrapSelection(prefix, suffix),
  replaceActiveWikiLink: (text: string) => markdownEditorRef.value?.replaceActiveWikiLink(text),
  focus: () => markdownEditorRef.value?.focus(),
});
</script>
