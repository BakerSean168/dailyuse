/**
 * useDesktopWindowControls
 *
 * Composable for desktop window control operations (minimize, maximize, close).
 * Receives the desktop bridge via Vue inject, falling back to window.electronAPI.
 *
 * Moved from apps/desktop (UI redesign V2 S1): the shell's WindowHeader renders
 * the window controls on every desktop route, while the desktop host still uses
 * it for the auth-screen titlebar.
 */
import { inject, reactive } from 'vue';
import { isOk, type Result } from '@dailyuse/contracts/result';
import { DESKTOP_BRIDGE_KEY, type DesktopBridge } from '../../di/keys';
import { RendererEventChannels, WindowChannels } from '@dailyuse/contracts/electron';

export interface WindowControlsState {
  isMaximized: boolean;
  isMinimizable: boolean;
  isMaximizable: boolean;
  isClosable: boolean;
}

function getBridge(): DesktopBridge | undefined {
  return (
    inject(DESKTOP_BRIDGE_KEY, undefined) ??
    ((window as { electronAPI?: DesktopBridge }).electronAPI as DesktopBridge | undefined)
  );
}

function readResultData<T>(response: unknown): T | null {
  if (!response || typeof response !== 'object' || !('ok' in response)) {
    return null;
  }
  const result = response as Result<T>;
  return isOk(result) ? (result.data ?? null) : null;
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
    const response = await bridge?.invoke(WindowChannels.GET_CONTROLS_STATE);
    applyState(readResultData<Partial<WindowControlsState>>(response));
  }

  async function minimizeWindow() {
    await bridge?.invoke(WindowChannels.MINIMIZE);
  }

  async function toggleMaximize() {
    const response = await bridge?.invoke(WindowChannels.TOGGLE_MAXIMIZE);
    applyState(readResultData<Partial<WindowControlsState>>(response));
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
