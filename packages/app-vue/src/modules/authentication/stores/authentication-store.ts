import { defineStore } from 'pinia';
import type {
  CloudAccountSummary,
  CloudAuthResponse,
  CloudSessionState,
  CloudSessionSummary,
} from '@memoflow/contracts';

export interface AuthenticationState {
  account: CloudAccountSummary | null;
  session: CloudSessionSummary | null;
  isLoading: boolean;
  error: string | null;
  isInitializing: boolean;
}

export const useAuthenticationStore = defineStore('authentication', {
  state: (): AuthenticationState => ({
    account: null,
    session: null,
    isLoading: false,
    error: null,
    isInitializing: false,
  }),

  getters: {
    isAuthenticated: (state) => state.account !== null && state.session !== null,
    currentIdentity: (state) => state.account,
    currentSession: (state) => state.session,
    activeSessions: (state) => (state.session ? [state.session] : []),
    getActiveSessionCount: (state) => (state.session ? 1 : 0),
    getIdentityId: (state) => state.account?.id ?? null,
  },

  actions: {
    handleCloudAuthResponse(data: CloudAuthResponse) {
      this.account = data.account;
      this.session = data.session;
      this.error = null;
    },

    hydrateCloudSession(data: CloudSessionState) {
      this.account = data.account;
      this.session = data.session;
      this.error = null;
      this.isInitializing = false;
    },

    setActiveSessions(sessions: CloudSessionSummary[]) {
      this.session = sessions[0] ?? null;
    },

    setLoading(loading: boolean) {
      this.isLoading = loading;
    },

    setError(error: string | null) {
      this.error = error;
    },

    setIsInitializing(value: boolean) {
      this.isInitializing = value;
    },

    reset() {
      this.account = null;
      this.session = null;
      this.isLoading = false;
      this.error = null;
      this.isInitializing = false;
    },
  },
});
