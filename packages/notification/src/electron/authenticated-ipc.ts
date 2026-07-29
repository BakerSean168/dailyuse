import {
  createAuthenticatedIdentityIpcWrapper,
  createAuthenticatedIpcWrapper,
} from '@memoflow/contracts/electron';

export const withAuthenticatedValue = createAuthenticatedIpcWrapper({
  unexpectedErrorCode: 'INTERNAL_ERROR',
  unexpectedErrorMessage: 'Notification IPC failed',
});

export const withAuthenticatedIdentity = createAuthenticatedIdentityIpcWrapper({
  unexpectedErrorCode: 'INTERNAL_ERROR',
  unexpectedErrorMessage: 'Notification IPC failed',
});
