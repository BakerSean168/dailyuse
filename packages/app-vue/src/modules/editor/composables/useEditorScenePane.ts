import { computed, ref, type ComponentPublicInstance } from 'vue';
import type { EditorSelectionRange } from './useResourceInsertion';
import type { useActiveEditorDocument } from './useActiveEditorDocument';
import { logEditorIssue } from '../../../shared/utils/editor-issue-debug';

export interface EditorScenePaneController {
  insertText(text: string): void;
  insertTextAtSelection(text: string, selection?: EditorSelectionRange): void;
  wrapSelection(prefix: string, suffix: string): void;
  replaceActiveWikiLink(text: string): void;
  focus(): void;
}

export function useEditorScenePane(documentState: ReturnType<typeof useActiveEditorDocument>) {
  const activeDocumentPaneRef = ref<EditorScenePaneController | null>(null);
  const viewMode = ref<'source' | 'live' | 'preview'>('live');
  const editorContent = computed({
    get: () => documentState.content.value,
    set: (value: string) => documentState.updateContent(value),
  });

  function handleInsertText(text: string) {
    activeDocumentPaneRef.value?.insertText(text);
  }

  function insertTextAtSelection(text: string, selection?: EditorSelectionRange) {
    if (!activeDocumentPaneRef.value) {
      logEditorIssue('editor:insert-missed-pane-ref', {
        selection: selection ?? null,
        textLength: text.length,
      });
      return;
    }

    activeDocumentPaneRef.value?.insertTextAtSelection(text, selection);
  }

  function handleWrapSelection(prefix: string, suffix: string) {
    activeDocumentPaneRef.value?.wrapSelection(prefix, suffix);
  }

  function handleViewModeChange(mode: 'source' | 'live' | 'preview') {
    viewMode.value = mode;
  }

  function replaceActiveWikiLink(text: string) {
    activeDocumentPaneRef.value?.replaceActiveWikiLink(text);
  }

  function focusPane() {
    activeDocumentPaneRef.value?.focus();
  }

  function bindActiveDocumentPane(
    instance: Element | ComponentPublicInstance | EditorScenePaneController | null,
  ) {
    activeDocumentPaneRef.value =
      instance && typeof instance === 'object' && 'insertText' in instance
        ? (instance as EditorScenePaneController)
        : null;
    logEditorIssue('editor:pane-ref-bound', {
      bound: Boolean(activeDocumentPaneRef.value),
    });
  }

  return {
    activeDocumentPaneRef,
    bindActiveDocumentPane,
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
