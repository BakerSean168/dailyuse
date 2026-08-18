/**
 * Wallet account not found (goal application layer).
 *
 * Typed provider-boundary error thrown by wallet repository implementations when
 * `recordTransaction` targets a missing account. The message text is preserved
 * for observability but control flow must use `instanceof`, never message text.
 */
export class WalletAccountNotFoundError extends Error {
  constructor() {
    super('ACCOUNT_NOT_FOUND');
    this.name = 'WalletAccountNotFoundError';
  }
}