import { computed, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useActiveEditorDocument } from './useActiveEditorDocument';
import { useEditorLinkIndex } from './useEditorLinkIndex';
import { useResourceReferenceIndex } from './useResourceReferenceIndex';
import { useEditorScenePane } from './useEditorScenePane';
import { useEditorSceneDialogs } from './useEditorSceneDialogs';
import { useEditorSceneSave } from './useEditorSceneSave';
import { useEditorSceneNavigation } from './useEditorSceneNavigation';
import { useEditorSceneInsertion } from './useEditorSceneInsertion';

interface UseEditorSceneOptions {
  onOpenLinkedResource?: (resourceId: string) => void | Promise<void>;
  saveSuccessMessage?: string;
  saveFailureMessage?: string;
  /** 初始视图模式；/note/:id 着陆页预览优先（Plan §10-4） */
  initialViewMode?: 'source' | 'live' | 'preview';
}

export function useEditorScene(
  resourceId: Ref<string | null>,
  options: UseEditorSceneOptions = {},
) {
  const { t } = useI18n();
  const documentState = useActiveEditorDocument(resourceId);
  const pane = useEditorScenePane(documentState, { initialViewMode: options.initialViewMode });
  const {
    resolveNote,
    createMarkdownNote,
    imageResources,
    resourceItems,
    recentResources,
    insertUploadedImages,
    insertExistingImage,
    insertExistingResource,
    exportMarkdownAsSelfContained,
    error,
  } = useEditorLinkIndex();
  const { getUnresolvedReferences } = useResourceReferenceIndex();

  const content = pane.editorContent;
  const resource = computed(() => documentState.resource.value);
  const isLoading = computed(() => documentState.isLoading.value);
  const isSaving = computed(() => documentState.isSaving.value);
  const isDirty = computed(() => documentState.isDirty.value);
  const loadError = computed(() => documentState.error.value || error.value || null);
  const brokenDiagnostics = computed(() =>
    resource.value ? getUnresolvedReferences(resource.value.id) : [],
  );
  const brokenReferences = computed(() => brokenDiagnostics.value.map((item) => item.reference));
  const dialogs = useEditorSceneDialogs({
    t,
    currentResource: resource,
    editorContent: content,
    resourceItems,
    insertTextAtSelection: pane.insertTextAtSelection,
    insertExistingImage,
    insertExistingResource,
    exportMarkdownAsSelfContained,
    focusPane: pane.focusPane,
  });
  const saveState = useEditorSceneSave({
    t,
    isDirty,
    save: documentState.save,
    saveSuccessMessage: options.saveSuccessMessage,
    saveFailureMessage: options.saveFailureMessage,
  });
  const navigation = useEditorSceneNavigation({
    t,
    resolveNote,
    onOpenLinkedResource: options.onOpenLinkedResource,
  });
  const insertion = useEditorSceneInsertion({
    t,
    currentResource: resource,
    recentResources,
    insertUploadedImages,
    insertTextAtSelection: pane.insertTextAtSelection,
  });

  watch(resource, dialogs.resetTransientUi);

  return {
    document: {
      resource,
      content,
      lastSavedContent: computed(() => documentState.lastSavedContent.value),
      status: {
        isLoading,
        isSaving,
        isDirty,
        error: loadError,
      },
    },
    pane: {
      ref: pane.activeDocumentPaneRef,
      bindRef: pane.bindActiveDocumentPane,
      viewMode: pane.viewMode,
      actions: {
        insertText: pane.handleInsertText,
        insertTextAtSelection: pane.insertTextAtSelection,
        wrapSelection: pane.handleWrapSelection,
        replaceActiveWikiLink: pane.replaceActiveWikiLink,
        focus: pane.focusPane,
        setViewMode: pane.handleViewModeChange,
      },
    },
    resources: {
      imageResources,
      resourceItems,
      recentImageResources: insertion.recentImageResources,
      recentResourceItems: insertion.recentResourceItems,
    },
    diagnostics: {
      items: brokenDiagnostics,
      brokenReferences,
      repairCandidates: dialogs.repairCandidates,
    },
    dialogs: {
      imagePicker: {
        open: dialogs.showImagePicker,
      },
      resourcePicker: {
        open: dialogs.showResourcePicker,
      },
      export: {
        open: dialogs.showExportDialog,
        result: dialogs.exportResult,
      },
      repair: {
        open: dialogs.showRepairDialog,
        reference: dialogs.pendingRepairReference,
      },
    },
    actions: {
      save: saveState.handleSave,
      pasteFiles: insertion.handlePasteFiles,
      openInternalLink: navigation.handleInternalLinkClick,
      insertExistingImage: dialogs.handleInsertExistingImage,
      insertResource: dialogs.handleInsertResource,
      exportSelfContained: dialogs.handleExportSelfContained,
      copyExport: dialogs.handleCopyExport,
      downloadExport: dialogs.handleDownloadExport,
      repairReference: dialogs.handleRepairReference,
      applyRepairCandidate: dialogs.applyRepairCandidate,
      resetTransientUi: dialogs.resetTransientUi,
      createMarkdownNote,
    },
    internal: {
      documentState,
    },
  };
}
