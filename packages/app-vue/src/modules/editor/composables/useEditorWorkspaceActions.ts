import { useEditorWorkspaceStore } from '../stores/editorWorkspaceStore';
import { useEditorUnsavedChangesGuard } from './useEditorUnsavedChangesGuard';
import { useEditorDocumentRegistry } from './useEditorDocumentRegistry';
import { useRepositoryResourceGateway } from '../../repository/services/repositoryResourceGateway';

export function useEditorWorkspaceActions() {
  const editorWorkspaceStore = useEditorWorkspaceStore();
  const guard = useEditorUnsavedChangesGuard();
  const registry = useEditorDocumentRegistry();
  const resourceGateway = useRepositoryResourceGateway();

  async function requestOpenResource(resourceId: string) {
    console.info('[EditorWorkspaceActions] requestOpenResource:start', {
      resourceId,
      repositoryId: resourceGateway.repositoryId.value,
    });

    await resourceGateway.ensureReady();
    const resource = await resourceGateway.getResource(resourceId);
    if (!resource) {
      console.warn('[EditorWorkspaceActions] requestOpenResource:resource-not-found', {
        resourceId,
        repositoryId: resourceGateway.repositoryId.value,
      });
      return null;
    }

    const opened = await editorWorkspaceStore.openResource({
      resourceId,
      title: resource.displayName || resource.name,
      workspaceId: resourceGateway.repositoryId.value,
    });

    console.info('[EditorWorkspaceActions] requestOpenResource:done', {
      resourceId,
      openedTabId: opened?.id ?? null,
    });
    return opened;
  }

  async function requestSetActiveTab(tabId: string) {
    await editorWorkspaceStore.setActiveTab(tabId);
  }

  async function requestSetTabPinned(tabId: string, isPinned: boolean) {
    await editorWorkspaceStore.setTabPinned(tabId, isPinned);
  }

  async function requestCloseTab(tabId: string) {
    const tab = editorWorkspaceStore.openTabs.find((item) => item.id === tabId) ?? null;
    const confirmed = await guard.confirmCloseResource(tab?.resourceId);
    if (!confirmed) {
      return false;
    }

    await editorWorkspaceStore.closeTab(tabId);
    if (tab?.resourceId) {
      registry.disposeDocument(tab.resourceId);
    }
    return true;
  }

  async function requestCloseOtherTabs(tabId: string) {
    const resourceIds = editorWorkspaceStore.openTabs
      .filter((tab) => tab.id !== tabId && tab.resourceId)
      .map((tab) => tab.resourceId as string);
    const confirmed = await guard.confirmCloseResources(resourceIds);
    if (!confirmed) {
      return false;
    }

    for (const tab of editorWorkspaceStore.openTabs.filter((item) => item.id !== tabId)) {
      await editorWorkspaceStore.closeTab(tab.id);
      if (tab.resourceId) {
        registry.disposeDocument(tab.resourceId);
      }
    }

    return true;
  }

  async function requestCloseTabsToRight(tabId: string) {
    const tabs = editorWorkspaceStore.openTabs;
    const index = tabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) {
      return false;
    }

    const tabsToClose = tabs.slice(index + 1);
    const resourceIds = tabsToClose
      .filter((tab) => Boolean(tab.resourceId))
      .map((tab) => tab.resourceId as string);
    const confirmed = await guard.confirmCloseResources(resourceIds);
    if (!confirmed) {
      return false;
    }

    for (const tab of tabsToClose) {
      await editorWorkspaceStore.closeTab(tab.id);
      if (tab.resourceId) {
        registry.disposeDocument(tab.resourceId);
      }
    }

    return true;
  }

  async function requestCloseAllTabs() {
    const resourceIds = editorWorkspaceStore.openTabs
      .filter((tab) => Boolean(tab.resourceId))
      .map((tab) => tab.resourceId as string);
    const confirmed = await guard.confirmCloseResources(resourceIds);
    if (!confirmed) {
      return false;
    }

    for (const tab of [...editorWorkspaceStore.openTabs]) {
      await editorWorkspaceStore.closeTab(tab.id);
      if (tab.resourceId) {
        registry.disposeDocument(tab.resourceId);
      }
    }

    return true;
  }

  return {
    requestOpenResource,
    requestSetActiveTab,
    requestSetTabPinned,
    requestCloseTab,
    requestCloseOtherTabs,
    requestCloseTabsToRight,
    requestCloseAllTabs,
  };
}
