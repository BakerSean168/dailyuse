import type { IEditorSessionRepository } from '../../../domain-server/repositories/IEditorSessionRepository';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/IEditorGroupRepository';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';
import type { EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { SessionRestorer } from '../../../domain-server/services/SessionRestorer';
import { loadSessionWithGroups } from './editor-session-helpers';

/**
 * SetActiveEditorTabUseCase
 * Sets the active tab within a session.
 */
export class SetActiveEditorTabUseCase {
  private readonly restorer = new SessionRestorer();

  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(sessionId: string, tabId: string): Promise<Result<EditorSessionClientDTO>> {
    const session = await loadSessionWithGroups(sessionId, this.sessionRepository, this.groupRepository, this.tabRepository);
    if (!session) {
      return error('NOT_FOUND', `会话不存在: ${sessionId}`);
    }

    session.setActiveTab(tabId);
    await this.sessionRepository.save(session);

    return ok(this.restorer.restore(session).toClientDTO());
  }
}
