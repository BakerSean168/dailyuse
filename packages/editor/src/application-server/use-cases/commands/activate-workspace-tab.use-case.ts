import type { IEditorSessionRepository } from '../../../domain-server/repositories/IEditorSessionRepository';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/IEditorGroupRepository';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { loadWorkspaceSessionWithGroups, persistWorkspaceSessionState } from './workspace-helpers';

export class ActivateWorkspaceTabUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(
    workspaceId: string,
    sessionId: string,
    groupId: string,
    tabId: string,
  ): Promise<Result<void>> {
    const session = await loadWorkspaceSessionWithGroups(
      sessionId,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );
    if (!session) {
      return error('NOT_FOUND', `Session not found: ${sessionId}`);
    }

    session.setActiveTab(tabId);
    await persistWorkspaceSessionState(
      session,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );
    return ok(undefined);
  }
}
