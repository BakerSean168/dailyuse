import type { IEditorSessionRepository } from '../../../domain-server/repositories/IEditorSessionRepository';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/IEditorGroupRepository';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';
import type { EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { loadSessionWithGroups, persistSessionState } from './editor-session-helpers';

/**
 * RemoveEditorGroupUseCase
 * Removes a group from an existing session.
 */
export class RemoveEditorGroupUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(sessionId: string, groupId: string): Promise<Result<EditorSessionClientDTO>> {
    const session = await loadSessionWithGroups(sessionId, this.sessionRepository, this.groupRepository, this.tabRepository);
    if (!session) {
      return error('NOT_FOUND', `会话不存在: ${sessionId}`);
    }

    session.removeGroup(groupId);

    await persistSessionState(session, this.sessionRepository, this.groupRepository, this.tabRepository);

    return ok(session.toClientDTO());
  }
}
