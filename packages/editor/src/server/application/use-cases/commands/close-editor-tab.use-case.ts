import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import type { EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { SessionRestorer } from '../../../domain/services/session-restorer';
import { loadSessionWithGroups } from './editor-session-helpers';

/**
 * CloseEditorTabUseCase
 * Closes a tab within a session.
 */
export class CloseEditorTabUseCase {
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

    session.closeTab(tabId);
    await this.sessionRepository.save(session);

    return ok(this.restorer.restore(session).toClientDTO());
  }
}
