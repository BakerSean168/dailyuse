import { useAuthenticationStore } from '@memoflow/app-vue/web-core';
import { ResultHttpClient, resetEmailVerificationCircuit } from '@memoflow/http-client';

export const resultHttpClient = new ResultHttpClient({
  baseURL: '/api/v1',
  timeout: 15000,
  axiosConfig: { withCredentials: true },
  onUnauthorized: () => {
    resetEmailVerificationCircuit();
    try {
      useAuthenticationStore().reset();
    } catch {
      // The auth store may not be installed during early bootstrap failures.
    }
    window.location.href = '/auth';
  },
  enableLogging: import.meta.env.DEV,
});
