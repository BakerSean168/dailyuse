import type { IAuthSessionRepository } from '../../../domain-server';
import type { RevokeSessionReq, RevokeSessionRes } from '@dailyuse/contracts/authentication';
import type { Context } from '@dailyuse/contracts/shared';

export class RevokeSession {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  async execute(input: RevokeSessionReq, cx: Context): Promise<RevokeSessionRes> {
    const session = await this.sessionRepository.findById(input.sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (String(session.identityId) !== cx.identityId) {
      throw new Error('Cannot revoke a session that belongs to another identity');
    }

    if (session.isValid()) {
      session.revoke();
      await this.sessionRepository.save(session);
    }
  }
}
