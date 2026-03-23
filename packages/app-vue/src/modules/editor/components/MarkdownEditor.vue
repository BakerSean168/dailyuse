<template>
  <div class="relative flex h-full w-full flex-col">
    <div ref="editorRef" class="flex-1 overflow-auto" />
    <div
      v-if="previewImage"
      class="absolute inset-0 z-20 flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm"
      @click="closePreviewImage"
    >
      <figure
        class="flex max-h-full max-w-[min(92vw,72rem)] flex-col gap-3 rounded-2xl border bg-background p-4 shadow-2xl"
        @click.stop
      >
        <img
          :src="previewImage.src"
          :alt="previewImage.alt"
          class="max-h-[75vh] max-w-full rounded-xl object-contain"
        />
        <figcaption class="text-sm text-muted-foreground">
          {{ previewImage.alt }}
        </figcaption>
      </figure>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import { EditorState } from '@codemirror/state';
import { EditorView, type ViewUpdate } from '@codemirror/view';
import { createMarkdownEditorExtensions } from '../codemirror/createMarkdownEditorExtensions';
import { markdownLivePreview } from '../codemirror/markdownLivePreview';
import { findActiveWikiLinkRange } from '../utils/wikiLinks';
import { resolveMarkdownResourceReferences } from '../utils/markdownResourceReferences';
import type { EditorSelectionRange } from '../composables/useResourceInsertion';
import { useRepositoryResourceGateway } from '../../repository/services/repositoryResourceGateway';
import { logEditorIssue } from '../../../shared/utils/editorIssueDebug';
import { REPOSITORY_SERVICE_KEY } from '../../../di/keys';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    darkMode?: boolean;
    readonly?: boolean;
    placeholder?: string;
    viewMode?: 'source' | 'live';
  }>(),
  {
    darkMode: false,
    readonly: false,
    placeholder: '',
    viewMode: 'live',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
  keydown: [event: KeyboardEvent];
  'link-click': [title: string];
  'trigger-suggestion': [position: { x: number; y: number; query: string }];
  'close-suggestion': [];
  'paste-files': [files: File[], selection: EditorSelectionRange];
}>();

const editorRef = ref<HTMLElement | null>(null);
const livePreviewImageSources = shallowRef<ReadonlyMap<string, string>>(new Map());
const previewImage = ref<{ src: string; alt: string } | null>(null);

let editorView: EditorView | null = null;
let livePreviewCompartment: ReturnType<typeof createMarkdownEditorExtensions>['livePreviewCompartment'] | null =
  null;
let imageSyncRunId = 0;
let repository: ReturnType<typeof useRepositoryResourceGateway> | null = null;
const currentInstance = getCurrentInstance();
const hasRepositoryService = Boolean(
  currentInstance?.appContext.provides[REPOSITORY_SERVICE_KEY as symbol],
);

if (hasRepositoryService) {
  repository = useRepositoryResourceGateway();
}

function handleContentChange(content: string) {
  emit('update:modelValue', content);
  emit('change', content);
}

function emitSuggestionState(view: EditorView | null = editorView) {
  if (!view) {
    return;
  }

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

function getSelectionRange(): EditorSelectionRange {
  if (!editorView) {
    return { from: 0, to: 0 };
  }

  const { from, to } = editorView.state.selection.main;
  return { from, to };
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && previewImage.value) {
    previewImage.value = null;
    return;
  }

  emit('keydown', event);
  queueMicrotask(() => emitSuggestionState());
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

function toggleTaskCheckbox(from: number, to: number, checked: boolean) {
  if (!editorView || props.readonly) {
    return;
  }

  const nextValue = checked ? '[ ]' : '[x]';
  editorView.dispatch({
    changes: {
      from,
      to,
      insert: nextValue,
    },
    selection: { anchor: from + nextValue.length },
  });
  editorView.focus();
}

function handleEditorClick(event: MouseEvent) {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target) {
    return;
  }

  const previewImageTarget = target.closest<HTMLImageElement>('[data-image-preview-src]');
  if (previewImageTarget) {
    event.preventDefault();
    previewImage.value = {
      src: previewImageTarget.dataset.imagePreviewSrc ?? previewImageTarget.getAttribute('src') ?? '',
      alt: previewImageTarget.dataset.imagePreviewAlt ?? previewImageTarget.getAttribute('alt') ?? '',
    };
    return;
  }

  const taskToggle = target.closest<HTMLElement>('[data-task-from][data-task-to]');
  if (taskToggle) {
    event.preventDefault();
    toggleTaskCheckbox(
      Number(taskToggle.dataset.taskFrom ?? 0),
      Number(taskToggle.dataset.taskTo ?? 0),
      taskToggle.dataset.taskChecked === 'true',
    );
    return;
  }

  const codeCopyButton = target.closest<HTMLElement>('[data-code-copy-from][data-code-copy-to]');
  if (codeCopyButton) {
    event.preventDefault();
    void copyCodeBlock(
      Number(codeCopyButton.dataset.codeCopyFrom ?? 0),
      Number(codeCopyButton.dataset.codeCopyTo ?? 0),
    );
    return;
  }

  const wikiLink = target.closest<HTMLElement>('[data-wiki-title]');
  if (wikiLink) {
    event.preventDefault();
    emit('link-click', wikiLink.dataset.wikiTitle ?? '');
  }
}

async function copyCodeBlock(from: number, to: number) {
  if (!editorView || Number.isNaN(from) || Number.isNaN(to) || to < from) {
    return;
  }

  const code = editorView.state.doc.sliceString(from, to).replace(/\n$/, '');
  if (!code) {
    return;
  }

  await navigator.clipboard?.writeText(code);
}

function closePreviewImage() {
  previewImage.value = null;
}

function handleEditorUpdate(update: ViewUpdate) {
  if (update.docChanged) {
    const content = update.state.doc.toString();
    handleContentChange(content);
    void syncLivePreviewImages(content);
  }

  if (update.docChanged || update.selectionSet) {
    emitSuggestionState(update.view);
  }
}

function initializeEditor() {
  if (!editorRef.value) {
    return;
  }

  const configuration = createMarkdownEditorExtensions({
    placeholderText: props.placeholder,
    readonly: props.readonly,
    viewMode: props.viewMode,
    imageSources: livePreviewImageSources.value,
    onUpdate: handleEditorUpdate,
    onKeydown: handleKeyDown,
    onPaste: handlePaste,
    onClick: handleEditorClick,
  });

  livePreviewCompartment = configuration.livePreviewCompartment;

  const state = EditorState.create({
    doc: props.modelValue,
    extensions: configuration.extensions,
  });

  editorView = new EditorView({
    state,
    parent: editorRef.value,
  });

  editorView.dom.addEventListener('click', handleEditorClick);
}

function destroyEditor() {
  editorView?.dom.removeEventListener('click', handleEditorClick);
  editorView?.destroy();
  editorView = null;
  livePreviewCompartment = null;
}

function reconfigureLivePreview() {
  if (!editorView || !livePreviewCompartment) {
    return;
  }

  editorView.dispatch({
    effects: livePreviewCompartment.reconfigure(
      props.viewMode === 'live'
        ? markdownLivePreview({ imageSources: livePreviewImageSources.value })
        : [],
    ),
  });
}

async function syncLivePreviewImages(markdown: string) {
  const currentRunId = ++imageSyncRunId;

  if (props.viewMode !== 'live') {
    livePreviewImageSources.value = new Map();
    reconfigureLivePreview();
    return;
  }

  if (!repository) {
    livePreviewImageSources.value = new Map();
    reconfigureLivePreview();
    return;
  }

  await repository.ensureReady();
  const references = resolveMarkdownResourceReferences(markdown, repository.resources.value).filter(
    (reference) => reference.kind === 'image' && reference.isRepositoryReference && reference.resource,
  );
  const nextSources = new Map<string, string>();

  for (const reference of references) {
    if (!reference.resource || nextSources.has(reference.destination)) {
      continue;
    }

    try {
      nextSources.set(reference.destination, await repository.readResourceAsDataUrl(reference.resource));
    } catch {
      // Preview falls back to caption-only cards for unresolved local assets.
    }
  }

  if (currentRunId !== imageSyncRunId) {
    return;
  }

  livePreviewImageSources.value = nextSources;
  reconfigureLivePreview();
}

function insertText(text: string) {
  if (!editorView) {
    return;
  }

  const { from, to } = editorView.state.selection.main;
  editorView.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  editorView.focus();
}

function replaceActiveWikiLink(text: string) {
  if (!editorView) {
    return;
  }

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

function insertTextAtCursor(text: string) {
  replaceActiveWikiLink(text);
}

function wrapSelection(prefix: string, suffix: string) {
  if (!editorView) {
    return;
  }

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
  if (!editorView) {
    return;
  }

  const { from, to } = editorView.state.selection.main;
  editorView.dispatch({
    changes: { from, to, insert: text },
    selection: { anchor: from + text.length },
  });
  editorView.focus();
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

function getSelection() {
  if (!editorView) {
    return '';
  }

  const { from, to } = editorView.state.selection.main;
  return editorView.state.doc.sliceString(from, to);
}

function focus() {
  editorView?.focus();
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
  getEditorView: () => editorView,
});

onMounted(() => {
  initializeEditor();
  emitSuggestionState();
  void syncLivePreviewImages(props.modelValue);
});

onBeforeUnmount(() => {
  destroyEditor();
});

watch(
  () => props.modelValue,
  (nextValue) => {
    if (!editorView) {
      return;
    }

    const currentValue = editorView.state.doc.toString();
    if (nextValue === currentValue) {
      return;
    }

    logEditorIssue('editor:model-sync-overwrite', {
      incomingLength: nextValue.length,
      currentLength: currentValue.length,
      incomingPreview: nextValue.slice(Math.max(0, nextValue.length - 160)),
      currentPreview: currentValue.slice(Math.max(0, currentValue.length - 160)),
    });

    editorView.dispatch({
      changes: { from: 0, to: currentValue.length, insert: nextValue },
    });
    emitSuggestionState();
    void syncLivePreviewImages(nextValue);
  },
);

watch(
  () => props.viewMode,
  () => {
    reconfigureLivePreview();
    void syncLivePreviewImages(editorView?.state.doc.toString() ?? props.modelValue);
  },
);
</script>

<style>
.cm-editor {
  height: 100%;
}
</style>
