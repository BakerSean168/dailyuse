import type { IEditorSessionRepository } from '../../../domain-server/repositories/IEditorSessionRepository';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/IEditorGroupRepository';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';
import type { EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { loadSessionWithGroups, persistSessionState } from './editor-session-helpers';

/**
 * ActivateEditorSessionUseCase
 * Activates a session and deactivates any previously active session in the workspace.
 */
export class ActivateEditorSessionUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(id: string, workspaceId: string): Promise<Result<EditorSessionClientDTO>> {
    const session = await loadSessionWithGroups(id, this.sessionRepository, this.groupRepository, this.tabRepository);
    if (!session) {
      return error('NOT_FOUND', `会话不存在: ${id}`);
    }

    const activeSession = await this.sessionRepository.findActiveByWorkspaceId(workspaceId);
    if (activeSession && activeSession.id !== id) {
      activeSession.deactivate();
      await this.sessionRepository.save(activeSession);
    }

    session.activate();
    await persistSessionState(session, this.sessionRepository, this.groupRepository, this.tabRepository);

    return ok(session.toClientDTO());
  }
}
