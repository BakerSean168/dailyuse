<template>
  <div class="flex flex-col w-full h-full">
    <div ref="editorRef" class="flex-1 overflow-auto" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

interface Props {
  modelValue: string;
  darkMode?: boolean;
  readonly?: boolean;
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  darkMode: false,
  readonly: false,
  placeholder: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  keydown: [event: KeyboardEvent];
  'trigger-suggestion': [position: { x: number; y: number; query: string }];
}>();

const editorRef = ref<HTMLElement | null>(null);
let editorView: EditorView | null = null;

function handleUpdate(content: string) {
  emit('update:modelValue', content);
  emit('change', content);
}

function getCursorPosition(): { x: number; y: number } | null {
  if (!editorView) return null;

  const { state } = editorView;
  const { from } = state.selection.main;

  const coords = editorView.coordsAtPos(from);
  if (!coords) return null;

  return {
    x: coords.left,
    y: coords.bottom,
  };
}

function getTextBeforeCursor(length: number = 50): string {
  if (!editorView) return '';

  const { state } = editorView;
  const { from } = state.selection.main;
  const startPos = Math.max(0, from - length);

  return state.doc.sliceString(startPos, from);
}

function handleKeyDown(event: KeyboardEvent) {
  emit('keydown', event);

  if (event.key === '[') {
    const textBefore = getTextBeforeCursor(2);
    if (textBefore.endsWith('[')) {
      const position = getCursorPosition();
      if (position) {
        setTimeout(() => {
          const textAfter = getTextBeforeCursor(50);
          const match = textAfter.match(/\[\[([^\]]*?)$/);
          const query = match ? match[1] : '';
          emit('trigger-suggestion', { ...position, query });
        }, 0);
      }
    }
  }
}

function initializeEditor() {
  if (!editorRef.value) return;

  const extensions: Extension[] = [
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        handleUpdate(update.state.doc.toString());
      }
    }),
    EditorView.lineWrapping,
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

  if (props.readonly) {
    editorView.contentDOM.setAttribute('contenteditable', 'false');
  }
}

function destroyEditor() {
  if (editorView) {
    editorView.contentDOM.removeEventListener('keydown', handleKeyDown);
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
  
  const { state } = editorView;
  const { from } = state.selection.main;
  
  const textBefore = getTextBeforeCursor(100);
  const lastBracketIndex = textBefore.lastIndexOf('[[');
  
  if (lastBracketIndex !== -1) {
    const deleteFrom = from - (textBefore.length - lastBracketIndex);
    
    editorView.dispatch({
      changes: { from: deleteFrom, to: from, insert: text },
      selection: { anchor: deleteFrom + text.length },
    });
  } else {
    editorView.dispatch({
      changes: { from, insert: text },
      selection: { anchor: from + text.length },
    });
  }
  
  editorView.focus();
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
      head: from + prefix.length + selectedText.length 
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
  wrapSelection,
  replaceSelection,
  getSelection,
  focus,
  editorView,
});

onMounted(() => {
  initializeEditor();
});

onBeforeUnmount(() => {
  destroyEditor();
});

watch(() => props.modelValue, (newValue) => {
  if (!editorView) return;
  
  const currentValue = editorView.state.doc.toString();
  if (newValue !== currentValue) {
    editorView.dispatch({
      changes: { from: 0, to: currentValue.length, insert: newValue },
    });
  }
});

watch(() => props.darkMode, () => {
  destroyEditor();
  initializeEditor();
});
</script>

<style>
.cm-editor {
  @apply h-full font-mono text-sm;
}

.cm-scroller {
  @apply overflow-auto;
}

.cm-content {
  @apply p-4;
}

.cm-line {
  @apply leading-relaxed;
}

.cm-line .tok-heading {
  @apply font-bold text-primary;
}

.cm-line .tok-strong {
  @apply font-bold;
}

.cm-line .tok-emphasis {
  @apply italic;
}

.cm-line .tok-link {
  @apply text-primary underline;
}

.cm-line .tok-monospace {
  @apply font-mono bg-muted px-1 py-0.5 rounded;
}
</style>
