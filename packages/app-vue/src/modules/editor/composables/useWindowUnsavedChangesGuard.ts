import { onBeforeUnmount, watch, type WatchStopHandle } from 'vue';
import { useEditorUnsavedChangesGuard } from './useEditorUnsavedChangesGuard';

export function useWindowUnsavedChangesGuard() {
  const { hasDirtyDocuments } = useEditorUnsavedChangesGuard();
  let stopWatching: WatchStopHandle | null = null;
  let isBound = false;

  function handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!hasDirtyDocuments.value) {
      return;
    }

    event.preventDefault();
    event.returnValue = '';
  }

  function bindWindowGuard() {
    if (typeof window === 'undefined' || isBound) {
      return;
    }

    isBound = true;
    stopWatching = watch(
      hasDirtyDocuments,
      (hasDirty) => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (hasDirty) {
          window.addEventListener('beforeunload', handleBeforeUnload);
        }
      },
      { immediate: true },
    );

    onBeforeUnmount(() => {
      stopWatching?.();
      stopWatching = null;
      isBound = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    });
  }

  return {
    bindWindowGuard,
  };
}
