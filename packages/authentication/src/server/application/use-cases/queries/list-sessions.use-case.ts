import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { ListSessionsRes } from '@dailyuse/contracts/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import type { IAuthSessionRepository } from '../../../domain';

export class ListSessionsUseCase {
  constructor(private readonly sessionRepository: IAuthSessionRepository) {}

  async execute(cx: ExecutionContext, currentSessionId?: string): Promise<Result<ListSessionsRes>> {
    const sessions = await this.sessionRepository.findByIdentityId(IdentityId.of(cx.identityId));

    return ok({
      sessions: sessions.map((session) =>
        session.toClientDTO(currentSessionId ? String(session.id) === currentSessionId : false),
      ),
    });
  }
}
