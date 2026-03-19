import { watch, type Ref } from 'vue';
import { useEditorWorkspaceStore } from '../stores/editorWorkspaceStore';

export function useEditorWorkspaceBootstrap(repositoryId: Ref<string | null | undefined>) {
  const editorWorkspaceStore = useEditorWorkspaceStore();

  async function hydrateWorkspace() {
    await editorWorkspaceStore.setWorkspace(repositoryId.value ?? null);
  }

  function bindWorkspaceLifecycle() {
    return watch(repositoryId, async (value) => {
      await editorWorkspaceStore.setWorkspace(value ?? null);
    });
  }

  return {
    hydrateWorkspace,
    bindWorkspaceLifecycle,
  };
}
