import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { IAuthSessionRepository } from '../../../domain';
import type { RevokeSessionReq } from '@memoflow/contracts/authentication';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { IdentityId } from '@memoflow/domain-shared/shared';
import { AuthSessionId } from '../../../domain';

export class RevokeSessionUseCase {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  async execute(input: RevokeSessionReq, cx: ExecutionContext): Promise<Result<void>> {
    const session = await this.sessionRepository.findByIdForIdentity(
      IdentityId.of(cx.identityId),
      AuthSessionId.of(input.sessionId),
    );
    if (!session) {
      return error('NOT_FOUND', 'Session not found');
    }

    if (session.isValid()) {
      session.revoke();
      await this.sessionRepository.save(session);
    }

    return ok(undefined);
  }
}
