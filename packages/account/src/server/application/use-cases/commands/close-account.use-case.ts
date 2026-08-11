/**
 * Close Account Use Case
 * Uses AccountClosureCoordinator saga for identity and session revocation orchestration.
 */

import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { CloseAccountReq } from '@memoflow/contracts/account';
import type {
  AccountClosureCoordinator,
  AccountClosureReceipt,
} from '../../services/account-closure-coordinator';

export type CloseAccountCommand = CloseAccountReq & {
  idempotencyKey?: string;
};

export class CloseAccountUseCase {
  constructor(private readonly coordinator: AccountClosureCoordinator) {}

  async execute(
    request: CloseAccountCommand,
    cx: ExecutionContext,
  ): Promise<Result<AccountClosureReceipt>> {
    // Stable default idempotency key scoped to identity without user free-form text
    const idempotencyKey = request.idempotencyKey || `close:${cx.identityId}`;

    try {
      const receipt = await this.coordinator.execute(cx.identityId, idempotencyKey, {
        reason: request.reason,
        feedback: request.feedback,
      });

      if (receipt.status === 'failed') {
        const errorMsg = receipt.lastError ?? 'Account closure operation failed';
        if (errorMsg.includes('Account not found')) {
          return error('NOT_FOUND', errorMsg);
        }
        return error('INTERNAL_ERROR', errorMsg);
      }

      return ok(receipt);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('Account not found')) {
        return error('NOT_FOUND', message);
      }
      return error('INTERNAL_ERROR', message);
    }
  }
}
