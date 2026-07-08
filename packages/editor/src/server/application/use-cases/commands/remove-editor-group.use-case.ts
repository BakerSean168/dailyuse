import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
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
