import { onActivated, onBeforeUnmount, onDeactivated, watch, type Ref } from 'vue';
import { getActivePinia } from 'pinia';
import { useAppShellStore, type PanelSurfaceStatus } from './useAppShellStore';

/**
 * Registers the active business view's explicit transition status with the shell.
 * Cached views re-publish on activation; hidden views never compete for ownership.
 */
export function usePanelSurfaceStatus(status: Ref<PanelSurfaceStatus>): void {
  const store = getActivePinia() ? useAppShellStore() : null;
  let active = true;

  const publish = () => {
    if (active) store?.setSurfaceStatus(status.value);
  };

  watch(status, publish, { immediate: true });

  onActivated(() => {
    active = true;
    publish();
  });

  onDeactivated(() => {
    active = false;
  });

  onBeforeUnmount(() => {
    if (active) store?.setSurfaceStatus('clean');
  });
}
