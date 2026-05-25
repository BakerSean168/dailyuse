/**
 * Loading state management - Framework agnostic
 */

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface LoadingStore {
  start: (message?: string) => void;
  stop: () => void;
  withLoading: <T>(fn: () => Promise<T>, message?: string) => Promise<T>;
}

export interface LoadingStoreAdapter {
  getState: () => LoadingState;
  setState: (state: LoadingState) => void;
}

/**
 * Create a loading store with custom state adapter
 */
export function createLoadingStore(adapter: LoadingStoreAdapter): LoadingStore {
  return {
    start: (message?: string) => {
      adapter.setState({
        isLoading: true,
        message,
      });
    },

    stop: () => {
      adapter.setState({
        isLoading: false,
        message: undefined,
      });
    },

    withLoading: async <T>(fn: () => Promise<T>, message?: string): Promise<T> => {
      adapter.setState({
        isLoading: true,
        message,
      });
      try {
        return await fn();
      } finally {
        adapter.setState({
          isLoading: false,
          message: undefined,
        });
      }
    },
  };
}
