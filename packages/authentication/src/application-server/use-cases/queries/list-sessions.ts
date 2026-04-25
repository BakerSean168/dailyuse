import type { ListSessionsRes } from '@dailyuse/contracts/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import type { IAuthSessionRepository } from '../../../domain-server';

export class ListSessions {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  async execute(identityId: string, currentSessionId?: string): Promise<ListSessionsRes> {
    const sessions = await this.sessionRepository.findByIdentityId(IdentityId.of(identityId));

    return {
      sessions: sessions.map((session) =>
        session.toClientDTO(currentSessionId ? String(session.id) === currentSessionId : false),
      ),
    };
  }
}
