import {
  createAuthenticatedIpcWrapper,
  createAuthenticatedIdentityIpcWrapper,
} from '@dailyuse/contracts/electron';

export const withAuthenticatedValue = createAuthenticatedIpcWrapper({
  unexpectedErrorCode: 'INTERNAL_ERROR',
  unexpectedErrorMessage: 'Editor IPC failed',
});

export const withAuthenticatedIdentity = createAuthenticatedIdentityIpcWrapper({
  unexpectedErrorCode: 'INTERNAL_ERROR',
  unexpectedErrorMessage: 'Editor IPC failed',
});
