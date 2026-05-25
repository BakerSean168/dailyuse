import type { IEditorSessionRepository } from '../../../domain-server/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain-server/repositories/i-editor-tab-repository';
import type { EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { loadSessionWithGroups, persistSessionState } from './editor-session-helpers';

/**
 * AddEditorGroupUseCase
 * Adds a new group to an existing session.
 */
export class AddEditorGroupUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(sessionId: string, name?: string): Promise<Result<EditorSessionClientDTO>> {
    const session = await loadSessionWithGroups(sessionId, this.sessionRepository, this.groupRepository, this.tabRepository);
    if (!session) {
      return error('NOT_FOUND', `会话不存在: ${sessionId}`);
    }

    const groupCount = await this.groupRepository.countBySessionId(sessionId);
    session.addGroup({ groupIndex: groupCount, name: name ?? undefined });

    await persistSessionState(session, this.sessionRepository, this.groupRepository, this.tabRepository);

    return ok(session.toClientDTO());
  }
}
