export type AccountClosureFailureCode = 'ACCOUNT_NOT_FOUND' | 'ACCOUNT_CLOSURE_FAILED';

/** Machine-readable account-closure failure; diagnostic message is never used for branching. */
export class AccountClosureFailureError extends Error {
  constructor(
    readonly code: AccountClosureFailureCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message);
    if (options?.cause !== undefined) Object.assign(this, { cause: options.cause });
    this.name = 'AccountClosureFailureError';
  }
}

export function accountNotFoundForClosure(identityId: string): AccountClosureFailureError {
  return new AccountClosureFailureError(
    'ACCOUNT_NOT_FOUND',
    `Account not found for identityId: ${identityId}`,
  );
}

export function accountClosureFailureCode(error: unknown): AccountClosureFailureCode {
  return error instanceof AccountClosureFailureError ? error.code : 'ACCOUNT_CLOSURE_FAILED';
}
