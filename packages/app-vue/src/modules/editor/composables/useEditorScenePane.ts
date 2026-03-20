import { computed, ref, type Ref } from 'vue';
import type { EditorSelectionRange } from './useResourceInsertion';
import type { useActiveEditorDocument } from './useActiveEditorDocument';

export interface EditorScenePaneController {
  insertText(text: string): void;
  insertTextAtSelection(text: string, selection?: EditorSelectionRange): void;
  wrapSelection(prefix: string, suffix: string): void;
  replaceActiveWikiLink(text: string): void;
  focus(): void;
}

export function useEditorScenePane(documentState: ReturnType<typeof useActiveEditorDocument>) {
  const activeDocumentPaneRef = ref<EditorScenePaneController | null>(null);
  const viewMode = ref<'edit' | 'split' | 'preview'>('split');
  const editorContent = computed({
    get: () => documentState.content.value,
    set: (value: string) => documentState.updateContent(value),
  });

  function handleInsertText(text: string) {
    activeDocumentPaneRef.value?.insertText(text);
  }

  function insertTextAtSelection(text: string, selection?: EditorSelectionRange) {
    activeDocumentPaneRef.value?.insertTextAtSelection(text, selection);
  }

  function handleWrapSelection(prefix: string, suffix: string) {
    activeDocumentPaneRef.value?.wrapSelection(prefix, suffix);
  }

  function handleViewModeChange(mode: 'edit' | 'split' | 'preview') {
    viewMode.value = mode;
  }

  function replaceActiveWikiLink(text: string) {
    activeDocumentPaneRef.value?.replaceActiveWikiLink(text);
  }

  function focusPane() {
    activeDocumentPaneRef.value?.focus();
  }

  return {
    activeDocumentPaneRef,
    viewMode,
    editorContent,
    handleInsertText,
    insertTextAtSelection,
    handleWrapSelection,
    handleViewModeChange,
    replaceActiveWikiLink,
    focusPane,
  };
}
