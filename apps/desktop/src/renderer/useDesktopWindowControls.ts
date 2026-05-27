/**
 * useDesktopWindowControls
 *
 * Composable for desktop window control operations (minimize, maximize, close).
 * Receives the desktop bridge via Vue inject, falling back to window.electronAPI.
 */
import { inject, onBeforeUnmount, onMounted, reactive } from 'vue';
import { DESKTOP_BRIDGE_KEY, type DesktopBridge } from '@dailyuse/app-vue/di';
import { RendererEventChannels, WindowChannels } from '@dailyuse/contracts/electron';

interface WindowControlsState {
  isMaximized: boolean;
  isMinimizable: boolean;
  isMaximizable: boolean;
  isClosable: boolean;
}

function getBridge(): DesktopBridge | undefined {
  return inject(DESKTOP_BRIDGE_KEY, undefined) ?? (window.electronAPI as DesktopBridge | undefined);
}

export function useDesktopWindowControls() {
  const bridge = getBridge();

  const windowControlsState = reactive<WindowControlsState>({
    isMaximized: false,
    isMinimizable: true,
    isMaximizable: true,
    isClosable: true,
  });

  function applyState(state: Partial<WindowControlsState> | null | undefined) {
    if (!state) return;
    windowControlsState.isMaximized = state.isMaximized ?? windowControlsState.isMaximized;
    windowControlsState.isMinimizable = state.isMinimizable ?? windowControlsState.isMinimizable;
    windowControlsState.isMaximizable = state.isMaximizable ?? windowControlsState.isMaximizable;
    windowControlsState.isClosable = state.isClosable ?? windowControlsState.isClosable;
  }

  async function syncState() {
    const state = (await bridge?.invoke(WindowChannels.GET_CONTROLS_STATE)) as
      | Partial<WindowControlsState>
      | null
      | undefined;
    applyState(state);
  }

  async function minimizeWindow() {
    await bridge?.invoke(WindowChannels.MINIMIZE);
  }

  async function toggleMaximize() {
    const state = (await bridge?.invoke(WindowChannels.TOGGLE_MAXIMIZE)) as
      | Partial<WindowControlsState>
      | null
      | undefined;
    applyState(state);
  }

  async function closeWindow() {
    await bridge?.invoke(WindowChannels.CLOSE);
  }

  const handleStateChanged = (...args: unknown[]) => {
    applyState(args[0] as Partial<WindowControlsState> | null | undefined);
  };

  function startListening() {
    void syncState();
    bridge?.on(RendererEventChannels.WINDOW_STATE_CHANGED, handleStateChanged);
  }

  function stopListening() {
    bridge?.off(RendererEventChannels.WINDOW_STATE_CHANGED, handleStateChanged);
  }

  return {
    windowControlsState,
    minimizeWindow,
    toggleMaximize,
    closeWindow,
    startListening,
    stopListening,
  };
}
