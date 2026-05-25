/**
 * Dialog state management - Framework agnostic
 */

export interface DialogState {
  isOpen: boolean;
  title?: string;
  message?: string;
}

export interface DialogStore {
  open: (options?: { title?: string; message?: string }) => void;
  close: () => void;
}

export interface DialogStoreAdapter {
  getState: () => DialogState;
  setState: (state: DialogState) => void;
}

/**
 * Create a dialog store with custom state adapter
 */
export function createDialogStore(adapter: DialogStoreAdapter): DialogStore {
  return {
    open: (options?: { title?: string; message?: string }) => {
      adapter.setState({
        isOpen: true,
        title: options?.title,
        message: options?.message,
      });
    },
    close: () => {
      adapter.setState({
        isOpen: false,
        title: undefined,
        message: undefined,
      });
    },
  };
}
