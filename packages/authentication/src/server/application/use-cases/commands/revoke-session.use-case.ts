import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IAuthSessionRepository } from '../../../domain';
import type { RevokeSessionReq } from '@dailyuse/contracts/authentication';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import { IdentityId } from '@dailyuse/domain-shared/shared';
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
