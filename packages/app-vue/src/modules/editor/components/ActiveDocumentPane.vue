<template>
  <div class="flex h-full flex-col">
    <EditorToolbar
      :saving="saving"
      @insert-text="emit('insert-text', $event)"
      @insert-resource="emit('insert-resource')"
      @insert-existing-image="emit('insert-existing-image')"
      @export-self-contained="emit('export-self-contained')"
      @wrap-selection="handleWrapSelection"
      @view-mode-change="emit('view-mode-change', $event)"
      @save="emit('save')"
    />

    <EditorSplitView :view-mode="viewMode" class="flex-1">
      <template #editor>
        <div class="relative h-full">
          <MarkdownEditor
            ref="markdownEditorRef"
            :model-value="content"
            :placeholder="placeholder"
            @update:model-value="emit('update:content', $event)"
            @change="emit('change', $event)"
            @paste-files="handlePasteFiles"
            @trigger-suggestion="emit('trigger-suggestion', $event)"
            @close-suggestion="emit('close-suggestion')"
          />
          <slot name="editor-overlay" />
        </div>
      </template>
      <template #preview>
        <EditorPreview
          :content="content"
          :broken-resource-references="brokenResourceReferences"
          @link-click="emit('link-click', $event)"
        />
      </template>
    </EditorSplitView>

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
import EditorSplitView from './EditorSplitView.vue';
import EditorPreview from './EditorPreview.vue';
import type { ResourceReferenceUsage } from '../utils/resourceReferenceIndex';
import type { ResolvedMarkdownResourceReference } from '../utils/markdownResourceReferences';
import type { EditorSelectionRange } from '../composables/useResourceInsertion';

defineProps<{
  content: string;
  saving: boolean;
  dirty: boolean;
  viewMode: 'edit' | 'split' | 'preview';
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
  'view-mode-change': [mode: 'edit' | 'split' | 'preview'];
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
