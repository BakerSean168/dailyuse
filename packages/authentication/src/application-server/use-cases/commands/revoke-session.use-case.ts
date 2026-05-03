import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { IAuthSessionRepository } from '../../../domain-server';
import type { RevokeSessionReq } from '@dailyuse/contracts/authentication';
import type { ExecutionContext } from '@dailyuse/contracts/shared';

export class RevokeSessionUseCase {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  async execute(input: RevokeSessionReq, cx: ExecutionContext): Promise<Result<void>> {
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      return error('NOT_FOUND', 'Session not found');
    }

    if (String(session.identityId) !== cx.identityId) {
      return error('FORBIDDEN', 'Cannot revoke a session that belongs to another identity');
    }

    if (session.isValid()) {
      session.revoke();
      await this.sessionRepository.save(session);
    }

    return ok(undefined);
  }
}
