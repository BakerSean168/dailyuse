import { computed, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { useEditorUnsavedChangesGuard } from './useEditorUnsavedChangesGuard';
import { useWindowUnsavedChangesGuard } from './useWindowUnsavedChangesGuard';
import { useEditorScene } from './useEditorScene';
import { useEditorLinkSuggestion } from './useEditorLinkSuggestion';
import { getResourceDisplayName } from '../../repository/utils/resource-presentation';

export function useEditorLinearScene() {
  const { t } = useI18n();
  const route = useRoute();
  const router = useRouter();
  const { confirmLeaveWithDirtyDocuments } = useEditorUnsavedChangesGuard();
  const { bindWindowGuard } = useWindowUnsavedChangesGuard();

  const noteId = computed(() => String(route.params.id || ''));
  const editor = useEditorScene(noteId, {
    // 着陆场景第一动作是「看 AI 生成了什么」：默认预览（Plan §10-4）
    initialViewMode: 'preview',
    onOpenLinkedResource: async (id) => {
      void router.push({ name: 'note-edit', params: { id } });
    },
    saveSuccessMessage: t('editor.linear.saveSuccess'),
    saveFailureMessage: t('editor.linear.saveFailed'),
  });

  const title = computed(
    () =>
      (editor.document.resource.value
        ? getResourceDisplayName(editor.document.resource.value)
        : null) ||
      editor.document.resource.value?.name ||
      t('editor.linear.untitled'),
  );

  const suggestion = useEditorLinkSuggestion({
    t,
    currentResourceId: computed(() => editor.document.resource.value?.id ?? null),
    createMarkdownNote: editor.actions.createMarkdownNote,
    replaceActiveWikiLink: editor.pane.actions.replaceActiveWikiLink,
    focusPane: editor.pane.actions.focus,
    createFailedMessage: t('editor.linear.createLinkedFailed'),
    createSuccessMessage: (name: string) => t('editor.linear.createLinkedSuccess', { name }),
  });

  onBeforeRouteLeave(async () => confirmLeaveWithDirtyDocuments());
  bindWindowGuard();

  watch(noteId, () => {
    suggestion.closeSuggestion();
    editor.actions.resetTransientUi();
  });

  watch(editor.document.status.error, (message) => {
    if (message && !editor.internal.documentState.error.value) {
      console.error('Editor link index warning:', message);
    }
  });

  return reactive({
    header: {
      title,
      path: computed(() => editor.document.resource.value?.path || route.fullPath),
      actions: {
        openWorkspace: () => {
          void router.push({ name: 'repository' });
        },
      },
    },
    status: {
      isLoading: editor.document.status.isLoading,
      loadError: editor.document.status.error,
    },
    editor: {
      resource: editor.document.resource,
      content: editor.document.content,
      viewMode: editor.pane.viewMode,
      paneRef: editor.pane.ref,
      bindPaneRef: editor.pane.bindRef,
      status: {
        isSaving: editor.document.status.isSaving,
        isDirty: editor.document.status.isDirty,
        knowledgeIndex: editor.document.status.knowledgeIndex,
        knowledgeIndexError: editor.document.status.knowledgeIndexError,
      },
      diagnostics: editor.diagnostics,
      resources: editor.resources,
      dialogs: editor.dialogs,
      actions: {
        save: editor.actions.save,
        insertText: editor.pane.actions.insertText,
        wrapSelection: editor.pane.actions.wrapSelection,
        setViewMode: editor.pane.actions.setViewMode,
        openResourcePicker: () => {
          editor.dialogs.resourcePicker.open.value = true;
        },
        openImagePicker: () => {
          editor.dialogs.imagePicker.open.value = true;
        },
        exportSelfContained: editor.actions.exportSelfContained,
        pasteFiles: editor.actions.pasteFiles,
        openInternalLink: editor.actions.openInternalLink,
        repairReference: editor.actions.repairReference,
        insertExistingImage: editor.actions.insertExistingImage,
        insertResource: editor.actions.insertResource,
        copyExport: editor.actions.copyExport,
        downloadExport: editor.actions.downloadExport,
        applyRepairCandidate: editor.actions.applyRepairCandidate,
      },
    },
    suggestions: {
      state: suggestion.suggestionState,
      actions: {
        trigger: suggestion.handleTriggerSuggestion,
        close: suggestion.closeSuggestion,
        select: suggestion.handleSuggestionSelect,
        createLinkedNote: suggestion.handleCreateLinkedNote,
      },
    },
    sidecar: {
      noteId,
      actions: {
        navigate: (id: string) => {
          void router.push({ name: 'note-edit', params: { id } });
        },
        close: () => {},
      },
    },
  });
}
