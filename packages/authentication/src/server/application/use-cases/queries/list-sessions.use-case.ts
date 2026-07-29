import type { Result } from '@memoflow/contracts/result';
import { ok } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { ListSessionsRes } from '@memoflow/contracts/authentication';
import { IdentityId } from '@memoflow/domain-shared/shared';
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
