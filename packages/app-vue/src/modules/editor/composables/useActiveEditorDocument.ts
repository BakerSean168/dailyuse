import { computed, watch, type Ref } from 'vue';
import { useEditorDocumentRegistry } from './useEditorDocumentRegistry';

export function useActiveEditorDocument(resourceId: Ref<string | null>) {
  const registry = useEditorDocumentRegistry();

  const session = computed(() => registry.getDocument(resourceId.value));

  async function load(nextResourceId: string | null = resourceId.value, force = false) {
    await registry.ensureLoaded(nextResourceId, force);
  }

  async function reload() {
    await load(resourceId.value, true);
  }

  function updateContent(value: string) {
    session.value?.updateContent(value);
  }

  function reset() {
    session.value?.reset();
  }

  async function save() {
    return session.value ? session.value.save() : false;
  }

  watch(
    resourceId,
    (nextResourceId) => {
      void load(nextResourceId);
    },
    { immediate: true },
  );

  return {
    resource: computed(() => session.value?.resource.value ?? null),
    content: computed(() => session.value?.content.value ?? ''),
    lastSavedContent: computed(() => session.value?.lastSavedContent.value ?? ''),
    isDirty: computed(() => session.value?.isDirty.value ?? false),
    isLoading: computed(() => session.value?.isLoading.value ?? false),
    isSaving: computed(() => session.value?.isSaving.value ?? false),
    error: computed(() => session.value?.error.value ?? null),
    load,
    reload,
    updateContent,
    reset,
    save,
  };
}
