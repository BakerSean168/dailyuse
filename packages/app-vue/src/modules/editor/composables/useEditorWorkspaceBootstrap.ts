import { watch, type Ref } from 'vue';
import { useEditorWorkspaceStore } from '../stores/editorWorkspaceStore';
import { useEditorDocumentRegistry } from './useEditorDocumentRegistry';
import { useEditorUnsavedChangesGuard } from './useEditorUnsavedChangesGuard';

export function useEditorWorkspaceBootstrap(repositoryId: Ref<string | null | undefined>) {
  const editorWorkspaceStore = useEditorWorkspaceStore();
  const registry = useEditorDocumentRegistry();
  const guard = useEditorUnsavedChangesGuard();

  async function hydrateWorkspace() {
    await editorWorkspaceStore.setWorkspace(repositoryId.value ?? null);
  }

  function bindWorkspaceLifecycle() {
    let previousRepositoryId = repositoryId.value ?? null;

    return watch(repositoryId, async (value) => {
      if (previousRepositoryId && previousRepositoryId !== (value ?? null)) {
        const confirmed = await guard.confirmLeaveWithDirtyDocuments();
        if (!confirmed) {
          return;
        }

        registry.resetAll();
      }

      await editorWorkspaceStore.setWorkspace(value ?? null);
      previousRepositoryId = value ?? null;
    });
  }

  return {
    hydrateWorkspace,
    bindWorkspaceLifecycle,
  };
}
