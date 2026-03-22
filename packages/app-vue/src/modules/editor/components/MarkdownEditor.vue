<template>
  <div class="flex flex-col w-full h-full">
    <div ref="editorRef" class="flex-1 overflow-auto" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { findActiveWikiLinkRange } from '../utils/wikiLinks';
import type { EditorSelectionRange } from '../composables/useResourceInsertion';
import { logEditorIssue } from '../../../shared/utils/editorIssueDebug';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    darkMode?: boolean;
    readonly?: boolean;
    placeholder?: string;
  }>(),
  {
    darkMode: false,
    readonly: false,
    placeholder: '',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  keydown: [event: KeyboardEvent];
  'trigger-suggestion': [position: { x: number; y: number; query: string }];
  'close-suggestion': [];
  'paste-files': [files: File[], selection: EditorSelectionRange];
}>();

const editorRef = ref<HTMLElement | null>(null);
let editorView: EditorView | null = null;

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    color: 'hsl(var(--foreground))',
    backgroundColor: 'hsl(var(--background))',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.875rem',
    lineHeight: '1.25rem',
  },
  '.cm-content': {
    minHeight: '100%',
    padding: '1rem',
    caretColor: 'hsl(var(--foreground))',
  },
  '.cm-gutters': {
    color: 'hsl(var(--foreground))',
    backgroundColor: 'hsl(var(--background))',
    border: 'none',
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    backgroundColor: 'hsl(var(--muted) / 0.45)',
  },
  '&.cm-focused .cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'hsl(var(--foreground))',
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'hsl(var(--primary) / 0.28)',
  },
  '.cm-line': {
    lineHeight: '1.625',
  },
});

function handleUpdate(content: string) {
  emit('update:modelValue', content);
  emit('change', content);
}

function emitSuggestionState(view: EditorView | null = editorView) {
  if (!view) return;

  const cursor = view.state.selection.main.from;
  const content = view.state.doc.toString();
  const activeRange = findActiveWikiLinkRange(content, cursor);

  if (!activeRange) {
    emit('close-suggestion');
    return;
  }

  const coords = view.coordsAtPos(cursor);
  if (!coords) {
    emit('close-suggestion');
    return;
  }

  emit('trigger-suggestion', {
    x: coords.left,
    y: coords.bottom,
    query: activeRange.query,
  });
}

function handleKeyDown(event: KeyboardEvent) {
  emit('keydown', event);

  setTimeout(() => {
    emitSuggestionState();
  }, 0);
}

function handlePaste(event: ClipboardEvent) {
  const clipboardItems = Array.from(event.clipboardData?.items ?? []);
  const files = clipboardItems
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter(
      (file): file is File =>
        file !== null &&
        (file.type.startsWith('image/') || /\.(png|jpe?g|gif|svg|webp|bmp|avif)$/i.test(file.name)),
    );

  if (files.length === 0 || !editorView) {
    return;
  }

  event.preventDefault();
  const selection = getSelectionRange();
  logEditorIssue('editor:clipboard-paste-detected', {
    selection,
    clipboardItems: clipboardItems.map((item) => ({
      kind: item.kind,
      type: item.type,
    })),
    files: files.map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
    })),
  });
  emit('paste-files', files, selection);
}

function initializeEditor() {
  if (!editorRef.value) return;

  const extensions: Extension[] = [
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        handleUpdate(update.state.doc.toString());
      }

      if (update.docChanged || update.selectionSet) {
        emitSuggestionState(update.view);
      }
    }),
    EditorView.lineWrapping,
    editorTheme,
  ];

  if (props.readonly) {
    extensions.push(EditorView.editable.of(false));
  }

  const state = EditorState.create({
    doc: props.modelValue,
    extensions,
  });

  editorView = new EditorView({
    state,
    parent: editorRef.value,
  });

  editorView.contentDOM.addEventListener('keydown', handleKeyDown);
  editorView.contentDOM.addEventListener('paste', handlePaste);

  if (props.readonly) {
    editorView.contentDOM.setAttribute('contenteditable', 'false');
  }
}

function destroyEditor() {
  if (editorView) {
    editorView.contentDOM.removeEventListener('keydown', handleKeyDown);
    editorView.contentDOM.removeEventListener('paste', handlePaste);
    editorView.destroy();
    editorView = null;
  }
}

function insertText(text: string) {
  if (!editorView) return;

  const { state } = editorView;
  const { from, to } = state.selection.main;

  editorView.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });

  editorView.focus();
}

function insertTextAtCursor(text: string) {
  if (!editorView) return;

  replaceActiveWikiLink(text);
}

function replaceActiveWikiLink(text: string) {
  if (!editorView) return;

  const { state } = editorView;
  const { from, to } = state.selection.main;
  const content = state.doc.toString();
  const activeRange = from === to ? findActiveWikiLinkRange(content, from) : null;

  if (activeRange && from === to) {
    editorView.dispatch({
      changes: { from: activeRange.from, to: activeRange.to, insert: text },
      selection: { anchor: activeRange.from + text.length },
    });
  } else {
    editorView.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length },
    });
  }

  editorView.focus();
  emitSuggestionState();
}

function wrapSelection(prefix: string, suffix: string) {
  if (!editorView) return;

  const { state } = editorView;
  const { from, to } = state.selection.main;
  const selectedText = state.doc.sliceString(from, to);
  const wrappedText = `${prefix}${selectedText}${suffix}`;

  editorView.dispatch({
    changes: { from, to, insert: wrappedText },
    selection: {
      anchor: from + prefix.length,
      head: from + prefix.length + selectedText.length,
    },
  });

  editorView.focus();
}

function replaceSelection(text: string) {
  if (!editorView) return;

  const { state } = editorView;
  const { from, to } = state.selection.main;

  editorView.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });

  editorView.focus();
}

function getSelectionRange(): EditorSelectionRange {
  if (!editorView) return { from: 0, to: 0 };

  const { from, to } = editorView.state.selection.main;
  return { from, to };
}

function insertTextAtSelection(text: string, selection?: EditorSelectionRange) {
  if (!editorView) {
    logEditorIssue('editor:insert-at-selection:missing-view', {
      selection: selection ?? null,
      textLength: text.length,
    });
    return;
  }

  const range = selection ?? getSelectionRange();
  logEditorIssue('editor:insert-at-selection:start', {
    selection: range,
    textLength: text.length,
    textPreview: text.slice(0, 160),
    currentDocumentLength: editorView.state.doc.length,
  });

  editorView.dispatch({
    changes: { from: range.from, to: range.to, insert: text },
    selection: { anchor: range.from + text.length },
  });

  editorView.focus();
  emitSuggestionState();
  logEditorIssue('editor:insert-at-selection:done', {
    selection: range,
    nextDocumentLength: editorView.state.doc.length,
  });
}

function getSelection(): string {
  if (!editorView) return '';

  const { state } = editorView;
  const { from, to } = state.selection.main;
  return state.doc.sliceString(from, to);
}

function focus() {
  if (editorView) {
    editorView.focus();
  }
}

defineExpose({
  insertText,
  insertTextAtCursor,
  replaceActiveWikiLink,
  wrapSelection,
  replaceSelection,
  getSelection,
  getSelectionRange,
  insertTextAtSelection,
  focus,
  editorView,
});

onMounted(() => {
  initializeEditor();
  emitSuggestionState();
});

onBeforeUnmount(() => {
  destroyEditor();
});

watch(
  () => props.modelValue,
  (newValue) => {
    if (!editorView) return;

    const currentValue = editorView.state.doc.toString();
    if (newValue !== currentValue) {
      logEditorIssue('editor:model-sync-overwrite', {
        incomingLength: newValue.length,
        currentLength: currentValue.length,
        incomingPreview: newValue.slice(Math.max(0, newValue.length - 160)),
        currentPreview: currentValue.slice(Math.max(0, currentValue.length - 160)),
      });
      editorView.dispatch({
        changes: { from: 0, to: currentValue.length, insert: newValue },
      });
      emitSuggestionState();
    }
  },
);

watch(
  () => props.darkMode,
  () => {
    destroyEditor();
    initializeEditor();
  },
);
</script>

<style>
.cm-editor {
  height: 100%;
}

.cm-line .tok-heading {
  font-weight: 700;
  color: hsl(var(--primary));
}

.cm-line .tok-strong {
  font-weight: 700;
}

.cm-line .tok-emphasis {
  font-style: italic;
}

.cm-line .tok-link {
  color: hsl(var(--primary));
  text-decoration-line: underline;
}

.cm-line .tok-monospace {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  background-color: hsl(var(--muted));
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
}
</style>
