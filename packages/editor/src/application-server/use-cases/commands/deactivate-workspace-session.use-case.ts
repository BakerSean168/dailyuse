import type { IEditorSessionRepository } from '../../../domain-server/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain-server/repositories/i-editor-tab-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { loadWorkspaceSessionWithGroups, persistWorkspaceSessionState } from './workspace-helpers';

export class DeactivateWorkspaceSessionUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(workspaceId: string, sessionId: string): Promise<Result<void>> {
    const session = await loadWorkspaceSessionWithGroups(
      sessionId,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );
    if (!session) {
      return error('NOT_FOUND', `Session not found: ${sessionId}`);
    }

    session.deactivate();
    await persistWorkspaceSessionState(
      session,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );
    return ok(undefined);
  }
}
