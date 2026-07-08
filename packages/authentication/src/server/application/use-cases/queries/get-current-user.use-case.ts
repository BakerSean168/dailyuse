import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { GetCurrentUserRes } from '@dailyuse/contracts/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import {
  type IAuthIdentityRepository,
  type IAuthSessionRepository,
} from '../../../domain';
import { AuthSessionId } from '../../../domain';

export class GetCurrentUserUseCase {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
  ) {}

  async execute(cx: ExecutionContext, sessionId?: string): Promise<Result<GetCurrentUserRes>> {
    const identity = await this.identityRepository.findById(IdentityId.of(cx.identityId));
    if (!identity) {
      return error('NOT_FOUND', 'Identity not found');
    }

    let session = null;
    if (sessionId) {
      const currentSession = await this.sessionRepository.findById(AuthSessionId.of(sessionId));
      if (currentSession && String(currentSession.identityId) === String(identity.id)) {
        session = currentSession.toClientDTO(true);
      }
    }

    return ok({
      identity: identity.toClientDTO(),
      session,
    });
  }
}
