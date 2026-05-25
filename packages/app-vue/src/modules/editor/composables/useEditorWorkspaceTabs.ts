import { computed } from 'vue';
import { useRepositoryStore } from '../../repository/stores/repository-store';
import { getResourceIcon } from '../../repository/utils/resource-presentation';
import { useEditorDocumentRegistry } from './useEditorDocumentRegistry';
import { useEditorWorkspaceActions } from './useEditorWorkspaceActions';
import { useEditorWorkspaceStore } from '../stores/editor-workspace-store';

interface ResourceTabViewModel {
  id: string;
  name: string;
  icon: unknown;
  isDirty: boolean;
  isPinned: boolean;
}

export function useEditorWorkspaceTabs() {
  const repositoryStore = useRepositoryStore();
  const workspaceStore = useEditorWorkspaceStore();
  const { getDocument } = useEditorDocumentRegistry();
  const actions = useEditorWorkspaceActions();

  const openTabs = computed<ResourceTabViewModel[]>(
    () =>
      workspaceStore.openTabs
        .map((tab) => {
          if (!tab.resourceId) return null;
          const resource = repositoryStore.resources.find((item) => item.id === tab.resourceId);
          if (!resource) return null;
          return {
            id: tab.id,
            name: resource.name,
            icon: getResourceIcon(resource),
            isDirty: getDocument(resource.id)?.isDirty.value ?? false,
            isPinned: tab.isPinned,
          };
        })
        .filter(Boolean) as ResourceTabViewModel[],
  );

  async function handleSwitchTab(id: string) {
    await actions.requestSetActiveTab(id);
  }

  async function handleCloseTab(id: string) {
    await actions.requestCloseTab(id);
  }

  function handleTogglePin(id: string) {
    const tab = workspaceStore.openTabs.find((item) => item.id === id) ?? null;
    if (!tab) {
      return;
    }

    void actions.requestSetTabPinned(id, !tab.isPinned);
  }

  async function handleCloseOthers(id: string) {
    await actions.requestCloseOtherTabs(id);
  }

  async function handleCloseRight(id: string) {
    await actions.requestCloseTabsToRight(id);
  }

  async function handleCloseAll() {
    await actions.requestCloseAllTabs();
  }

  return {
    requestOpenResource: actions.requestOpenResource,
    openTabs,
    handleSwitchTab,
    handleCloseTab,
    handleTogglePin,
    handleCloseOthers,
    handleCloseRight,
    handleCloseAll,
  };
}
