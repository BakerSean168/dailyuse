import type { GetCurrentUserRes } from '@dailyuse/contracts/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import type { IAuthIdentityRepository, IAuthSessionRepository } from '@/domain-server';

export class GetCurrentUser {
  constructor(
    private readonly identityRepository: IAuthIdentityRepository,
    private readonly sessionRepository: IAuthSessionRepository,
  ) {}

  async execute(identityId: string, sessionId?: string): Promise<GetCurrentUserRes> {
    const identity = await this.identityRepository.findById(IdentityId.of(identityId));
    if (!identity) {
      throw new Error('Identity not found');
    }

    let session = null;
    if (sessionId) {
      const currentSession = await this.sessionRepository.findById(sessionId as any);
      if (currentSession && String(currentSession.identityId) === String(identity.id)) {
        session = currentSession.toClientDTO(true);
      }
    }

    return {
      identity: identity.toClientDTO(),
      session,
    };
  }
}
