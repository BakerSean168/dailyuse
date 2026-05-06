import { useEditorWorkspaceStore } from '../stores/editorWorkspaceStore';
import { useEditorUnsavedChangesGuard } from './useEditorUnsavedChangesGuard';
import { useEditorDocumentRegistry } from './useEditorDocumentRegistry';
import { useRepositoryResourceGateway } from '../../repository/services/repositoryResourceGateway';
import { getResourceDisplayName } from '../../repository/utils/resourcePresentation';
import { logEditorIssue, summarizeResourceForDebug } from '../../../shared/utils/editorIssueDebug';

export function useEditorWorkspaceActions() {
  const editorWorkspaceStore = useEditorWorkspaceStore();
  const guard = useEditorUnsavedChangesGuard();
  const registry = useEditorDocumentRegistry();
  const resourceGateway = useRepositoryResourceGateway();

  async function requestOpenResource(resourceId: string) {
    await resourceGateway.ensureReady();
    const resource = await resourceGateway.getResource(resourceId);
    if (!resource) {
      logEditorIssue('workspace:open-resource:not-found', {
        resourceId,
        repositoryId: resourceGateway.repositoryId.value,
      });
      return null;
    }

    const opened = await editorWorkspaceStore.openResource({
      resourceId,
      title: getResourceDisplayName(resource),
      workspaceId: resourceGateway.repositoryId.value,
    });

    logEditorIssue('workspace:open-resource', {
      resourceId,
      resource: summarizeResourceForDebug(resource),
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
    logEditorIssue('tabs:close-request', {
      tabId,
      resourceId: tab?.resourceId ?? null,
      resource: summarizeResourceForDebug(
        tab?.resourceId ? resourceGateway.getCachedResource(tab.resourceId) : null,
      ),
      isDirty: tab?.isDirty ?? null,
    });
    const confirmed = await guard.confirmCloseResource(tab?.resourceId);
    logEditorIssue('tabs:close-confirm', {
      tabId,
      confirmed,
      resourceId: tab?.resourceId ?? null,
    });
    if (!confirmed) {
      return false;
    }

    await editorWorkspaceStore.closeTab(tabId);
    if (tab?.resourceId) {
      registry.disposeDocument(tab.resourceId);
    }
    logEditorIssue('tabs:close-done', {
      tabId,
      remainingTabIds: editorWorkspaceStore.openTabs.map((item) => item.id),
    });
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
