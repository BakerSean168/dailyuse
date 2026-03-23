import { createAuthenticatedIpcWrapper } from '@dailyuse/contracts/electron';

export const withAuthenticatedValue = createAuthenticatedIpcWrapper({
  unexpectedErrorCode: 'INTERNAL_ERROR',
  unexpectedErrorMessage: 'Internal goal IPC error',
});
