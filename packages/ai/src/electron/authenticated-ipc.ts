import { createAuthenticatedIpcWrapper } from '@memoflow/contracts/electron';

export const withAuthenticatedValue = createAuthenticatedIpcWrapper({
  unexpectedErrorCode: 'INTERNAL_ERROR',
  unexpectedErrorMessage: 'AI operation failed',
});
