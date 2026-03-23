import { computed, onMounted, reactive, toRef, unref, watch, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Bookmark, FolderTree, Search } from 'lucide-vue-next';
import { useRepository } from '../../repository/composables/useRepository';
import { useRepositoryBookmarksPanel } from '../../repository/composables/useRepositoryBookmarksPanel';
import { useRepositoryResourceCommands } from '../../repository/composables/useRepositoryResourceCommands';
import { useRepositorySearchPanel } from '../../repository/composables/useRepositorySearchPanel';
import type { EditorWorkspaceSidebarMode } from '../stores/editorWorkspaceUiStore';
import { useEditorWorkspaceUiStore } from '../stores/editorWorkspaceUiStore';
import { useEditorScene } from './useEditorScene';
import { useEditorWorkspaceBootstrap } from './useEditorWorkspaceBootstrap';
import { useEditorWorkspaceTabs } from './useEditorWorkspaceTabs';
import { useWindowUnsavedChangesGuard } from './useWindowUnsavedChangesGuard';
import { useEditorWorkspaceStore } from '../stores/editorWorkspaceStore';

interface WorkspaceSceneTabItem {
  id: string;
  name: string;
  icon: unknown;
  isDirty: boolean;
  isPinned: boolean;
}

export function useRepositoryWorkspaceScene(initialSidebarMode: Ref<EditorWorkspaceSidebarMode>) {
  const { t } = useI18n();
  const repository = useRepository();
  const workspaceStore = useEditorWorkspaceStore();
  const workspaceUiStore = useEditorWorkspaceUiStore();
  const tabs = useEditorWorkspaceTabs();
  const activeResourceId = toRef(workspaceStore, 'activeResourceId');
  const editorScene = useEditorScene(activeResourceId, {
    onOpenLinkedResource: async (id) => {
      await tabs.requestOpenResource(id);
    },
    saveFailureMessage: t('repository.workspace.saveFailed'),
  });
  const resourceCommands = useRepositoryResourceCommands(editorScene.document.resource);
  const searchPanel = useRepositorySearchPanel();
  const bookmarksPanel = useRepositoryBookmarksPanel();
  const { hydrateWorkspace, bindWorkspaceLifecycle } = useEditorWorkspaceBootstrap(
    repository.repositoryId,
  );
  const { bindWindowGuard } = useWindowUnsavedChangesGuard();

  const sidebarModes = computed(() => [
    { key: 'files' as const, label: t('repository.sidebar.files'), icon: FolderTree },
    { key: 'search' as const, label: t('repository.sidebar.search'), icon: Search },
    { key: 'bookmarks' as const, label: t('repository.sidebar.bookmarks'), icon: Bookmark },
  ]);
  const editorWordCount = computed(() => {
    const rawContent = unref(editorScene.document.content);
    const text = typeof rawContent === 'string' ? rawContent : '';
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    return chineseChars + englishWords;
  });

  watch(resourceCommands.renameDialogOpen, (open) => {
    if (!open) {
      resourceCommands.resetRenameDialog();
    }
  });

  onMounted(async () => {
    workspaceUiStore.setSidebarMode(initialSidebarMode.value);
    await repository.initRepository();
    if (repository.repositoryId.value) {
      await hydrateWorkspace();
      await repository.fetchResources();
      await repository.fetchBookmarks();
    }
  });

  bindWorkspaceLifecycle();
  bindWindowGuard();

  return reactive({
    status: {
      repositoryId: repository.repositoryId,
      isLoading: repository.isLoading,
    },
    sidebar: {
      mode: toRef(workspaceUiStore, 'sidebarMode'),
      collapsed: toRef(workspaceUiStore, 'sidebarCollapsed'),
      modes: sidebarModes,
      actions: {
        setMode: workspaceUiStore.setSidebarMode,
        setCollapsed: workspaceUiStore.setSidebarCollapsed,
        toggle: workspaceUiStore.toggleSidebar,
      },
      files: {
        resourcesByType: repository.resourcesByType,
        treeNodes: repository.treeNodes,
        selectedId: toRef(workspaceStore, 'activeResourceId'),
        actions: {
          createNote: resourceCommands.handleCreateNote,
          refresh: resourceCommands.handleRefresh,
          open: resourceCommands.handleOpenResource,
          rename: resourceCommands.handleRenameResource,
          delete: resourceCommands.handleDeleteResourceFromTree,
          openImport: () => {
            resourceCommands.showImportDialog.value = true;
          },
        },
      },
      search: {
        repositoryId: repository.repositoryId,
        results: searchPanel.searchResults,
        status: {
          isSearching: searchPanel.isSearching,
          hasSearched: searchPanel.hasSearched,
          totalResults: searchPanel.searchTotalResults,
          totalMatches: searchPanel.searchTotalMatches,
          searchTime: searchPanel.searchTime,
        },
        actions: {
          search: searchPanel.handleSearch,
          select: searchPanel.handleSearchSelect,
          close: () => {
            workspaceUiStore.setSidebarMode('files');
          },
        },
      },
      bookmarks: {
        items: bookmarksPanel.bookmarks,
        capabilities: bookmarksPanel.bookmarkCapabilities,
        actions: {
          select: bookmarksPanel.handleBookmarkSelect,
          rename: bookmarksPanel.handleBookmarkRename,
          moveUp: bookmarksPanel.handleBookmarkMoveUp,
          moveDown: bookmarksPanel.handleBookmarkMoveDown,
          remove: bookmarksPanel.handleBookmarkRemove,
        },
      },
    },
    main: {
      tabs: {
        items: computed(() => tabs.openTabs.value as WorkspaceSceneTabItem[]),
        activeId: toRef(workspaceStore, 'activeTabId'),
        actions: {
          switch: tabs.handleSwitchTab,
          close: tabs.handleCloseTab,
          togglePin: tabs.handleTogglePin,
          closeOthers: tabs.handleCloseOthers,
          closeRight: tabs.handleCloseRight,
          closeAll: tabs.handleCloseAll,
        },
      },
      editor: {
        resource: editorScene.document.resource,
        content: editorScene.document.content,
        viewMode: editorScene.pane.viewMode,
        paneRef: editorScene.pane.ref,
        bindPaneRef: editorScene.pane.bindRef,
        status: {
          isSaving: editorScene.document.status.isSaving,
          isDirty: editorScene.document.status.isDirty,
        },
        diagnostics: {
          items: editorScene.diagnostics.items,
          brokenReferences: editorScene.diagnostics.brokenReferences,
          repairCandidates: editorScene.diagnostics.repairCandidates,
        },
        resources: {
          imageResources: editorScene.resources.imageResources,
          resourceItems: editorScene.resources.resourceItems,
          recentImageResources: editorScene.resources.recentImageResources,
          recentResourceItems: editorScene.resources.recentResourceItems,
        },
        dialogs: editorScene.dialogs,
        actions: {
          save: editorScene.actions.save,
          insertText: editorScene.pane.actions.insertText,
          wrapSelection: editorScene.pane.actions.wrapSelection,
          setViewMode: editorScene.pane.actions.setViewMode,
          pasteFiles: editorScene.actions.pasteFiles,
          openResourcePicker: () => {
            editorScene.dialogs.resourcePicker.open.value = true;
          },
          openImagePicker: () => {
            editorScene.dialogs.imagePicker.open.value = true;
          },
          exportSelfContained: editorScene.actions.exportSelfContained,
          openInternalLink: editorScene.actions.openInternalLink,
          repairReference: editorScene.actions.repairReference,
          insertExistingImage: editorScene.actions.insertExistingImage,
          insertResource: editorScene.actions.insertResource,
          copyExport: editorScene.actions.copyExport,
          downloadExport: editorScene.actions.downloadExport,
          applyRepairCandidate: editorScene.actions.applyRepairCandidate,
        },
        wordCount: editorWordCount,
      },
    },
    dialogs: {
      import: {
        open: resourceCommands.showImportDialog,
        isUploading: resourceCommands.isUploading,
        progress: resourceCommands.uploadProgress,
        summary: resourceCommands.importSummary,
        actions: {
          submit: resourceCommands.handleBatchImport,
          close: () => {
            resourceCommands.showImportDialog.value = false;
          },
        },
      },
      rename: {
        open: resourceCommands.renameDialogOpen,
        value: resourceCommands.renameValue,
        saveDisabled: resourceCommands.renameSaveDisabled,
        actions: {
          confirm: resourceCommands.confirmRenameResource,
          close: () => {
            resourceCommands.renameDialogOpen.value = false;
          },
        },
      },
    },
  });
}
