import { createAuthenticatedIdentityIpcWrapper } from '@dailyuse/contracts/electron';

export const withAuthenticatedIdentity = createAuthenticatedIdentityIpcWrapper({
  unexpectedErrorCode: 'INTERNAL_ERROR',
  unexpectedErrorMessage: 'DataPortability IPC failed',
});
