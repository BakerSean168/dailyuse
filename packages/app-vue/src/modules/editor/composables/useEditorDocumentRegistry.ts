import { computed, ref, type ComputedRef, type Ref } from 'vue';
import type { ResourceClientDTO } from '@dailyuse/contracts/repository';
import { useRepositoryResourceGateway } from '../../repository/services/repositoryResourceGateway';
import { useEditorWorkspaceStore } from '../stores/editorWorkspaceStore';
import {
  autoSaveEditorContent,
  getEditorContent,
  saveEditorContent,
} from '../services/editorDesktop.service';

export interface EditorDocumentSession {
  resourceId: string;
  resource: ComputedRef<ResourceClientDTO | null>;
  content: Ref<string>;
  lastSavedContent: Ref<string>;
  isDirty: ComputedRef<boolean>;
  isLoading: Ref<boolean>;
  isSaving: Ref<boolean>;
  error: Ref<string | null>;
  load: (force?: boolean) => Promise<void>;
  reload: () => Promise<void>;
  updateContent: (value: string) => void;
  reset: () => void;
  save: () => Promise<boolean>;
  dispose: () => void;
}

interface RegistryState {
  sessions: Map<string, EditorDocumentSession>;
}

let registryState: RegistryState | null = null;

function getRegistryState(): RegistryState {
  if (!registryState) {
    registryState = {
      sessions: new Map<string, EditorDocumentSession>(),
    };
  }

  return registryState;
}

export function useEditorDocumentRegistry() {
  const repository = useRepositoryResourceGateway();
  const editorWorkspaceStore = useEditorWorkspaceStore();
  const state = getRegistryState();

  function createSession(resourceId: string): EditorDocumentSession {
    const loadedResource = ref<ResourceClientDTO | null>(null);
    const content = ref('');
    const lastSavedContent = ref('');
    const isLoading = ref(false);
    const isSaving = ref(false);
    const error = ref<string | null>(null);
    const hasLoaded = ref(false);
    let loadRunId = 0;
    let autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

    const resource = computed(() => {
      return repository.getCachedResource(resourceId) ?? loadedResource.value;
    });

    const isDirty = computed(() => content.value !== lastSavedContent.value);

    function cancelAutoSave() {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
      }
    }

    function clearDocument() {
      cancelAutoSave();
      loadedResource.value = null;
      content.value = '';
      lastSavedContent.value = '';
      error.value = null;
      isLoading.value = false;
      isSaving.value = false;
      hasLoaded.value = false;
    }

    async function ensureRepositoryReady() {
      await repository.ensureReady();
    }

    async function load(force = false) {
      if (hasLoaded.value && !force) {
        return;
      }

      const currentRunId = ++loadRunId;
      isLoading.value = true;
      error.value = null;

      try {
        await ensureRepositoryReady();

        const cached = repository.getCachedResource(resourceId);
        const shouldHydrateFromCached = !hasLoaded.value || !isDirty.value;
        if (cached && shouldHydrateFromCached) {
          loadedResource.value = cached;
          content.value = typeof cached.content === 'string' ? cached.content : '';
          lastSavedContent.value = content.value;
        }

        const [hydrated, bridgedContent] = await Promise.all([
          repository.getResource(resourceId),
          getEditorContent(resourceId),
        ]);
        if (currentRunId !== loadRunId) {
          return;
        }

        const resolved = hydrated ?? repository.getCachedResource(resourceId) ?? null;
        if (!resolved) {
          clearDocument();
          error.value = 'Resource not found';
          return;
        }

        loadedResource.value = resolved;
        const nextContent =
          typeof bridgedContent?.content === 'string'
            ? bridgedContent.content
            : typeof resolved.content === 'string'
              ? resolved.content
              : '';

        if (force || !isDirty.value) {
          content.value = nextContent;
          lastSavedContent.value = nextContent;
        }

        hasLoaded.value = true;
      } catch (cause) {
        if (currentRunId !== loadRunId) {
          return;
        }

        clearDocument();
        error.value = cause instanceof Error ? cause.message : 'Failed to load document';
      } finally {
        if (currentRunId === loadRunId) {
          isLoading.value = false;
        }
      }
    }

    async function reload() {
      await load(true);
    }

    function scheduleAutoSave() {
      cancelAutoSave();
      if (!isDirty.value || isSaving.value || isLoading.value) {
        return;
      }

      autoSaveTimer = setTimeout(async () => {
        autoSaveTimer = null;
        if (!isDirty.value || isSaving.value || isLoading.value) {
          return;
        }

        const success = await autoSaveEditorContent({ resourceId, content: content.value });
        if (success) {
          lastSavedContent.value = content.value;
          const refreshedResource = await repository.getResource(resourceId);
          loadedResource.value = refreshedResource ?? loadedResource.value;
          error.value = null;
          return;
        }

        error.value = repository.error.value ?? 'Failed to auto save document';
      }, 800);
    }

    function updateContent(value: string) {
      content.value = value;
      void syncDirtyState(resourceId);
      scheduleAutoSave();
    }

    function reset() {
      cancelAutoSave();
      content.value = lastSavedContent.value;
      void syncDirtyState(resourceId);
    }

    async function save() {
      if (isSaving.value || !isDirty.value) {
        return false;
      }

      cancelAutoSave();
      isSaving.value = true;
      error.value = null;

      try {
        const success = await saveEditorContent({ resourceId, content: content.value });
        if (!success) {
          error.value = repository.error.value ?? 'Failed to save document';
          return false;
        }

        const refreshedResource = await repository.getResource(resourceId);
        loadedResource.value = refreshedResource ?? loadedResource.value;
        lastSavedContent.value = content.value;
        const tab = editorWorkspaceStore.findTabByResourceId(resourceId);
        if (tab) {
          await editorWorkspaceStore.syncTabDirtyState(tab.id, false);
        }
        return true;
      } finally {
        isSaving.value = false;
      }
    }

    function dispose() {
      clearDocument();
      state.sessions.delete(resourceId);
    }

    return {
      resourceId,
      resource,
      content,
      lastSavedContent,
      isDirty,
      isLoading,
      isSaving,
      error,
      load,
      reload,
      updateContent,
      reset,
      save,
      dispose,
    };
  }

  function getDocument(resourceId: string | null | undefined): EditorDocumentSession | null {
    if (!resourceId) {
      return null;
    }

    let session = state.sessions.get(resourceId) ?? null;
    if (!session) {
      session = createSession(resourceId);
      state.sessions.set(resourceId, session);
    }

    return session;
  }

  async function ensureLoaded(resourceId: string | null | undefined, force = false) {
    const session = getDocument(resourceId);
    if (!session) {
      return null;
    }

    await session.load(force);
    return session;
  }

  async function syncDirtyState(resourceId: string | null | undefined) {
    if (!resourceId) {
      return;
    }

    const session = getDocument(resourceId);
    const tab = editorWorkspaceStore.findTabByResourceId(resourceId);
    if (!session || !tab) {
      return;
    }

    await editorWorkspaceStore.syncTabDirtyState(tab.id, session.isDirty.value);
  }

  function getDirtyDocuments() {
    return Array.from(state.sessions.values()).filter((session) => session.isDirty.value);
  }

  function hasDirtyDocuments() {
    return getDirtyDocuments().length > 0;
  }

  function disposeDocument(resourceId: string | null | undefined) {
    const session = getDocument(resourceId);
    session?.dispose();
  }

  function resetAll() {
    for (const session of Array.from(state.sessions.values())) {
      session.dispose();
    }
  }

  return {
    getDocument,
    ensureLoaded,
    syncDirtyState,
    getDirtyDocuments,
    hasDirtyDocuments,
    disposeDocument,
    resetAll,
  };
}
