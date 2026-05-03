import type { IEditorSessionRepository } from '../../../domain-server/repositories/IEditorSessionRepository';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/IEditorGroupRepository';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { EditorSessionServerDTO, SessionLayoutServerDTO } from '@dailyuse/contracts/editor';
import { loadWorkspaceSessionWithGroups, persistWorkspaceSessionState } from './workspace-helpers';

export class UpdateWorkspaceSessionUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(params: {
    workspaceId: string;
    sessionId: string;
    name?: string;
    layout?: Partial<SessionLayoutServerDTO>;
    isActive?: boolean;
  }): Promise<Result<EditorSessionServerDTO>> {
    const session = await loadWorkspaceSessionWithGroups(
      params.sessionId,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );
    if (!session) {
      return error('NOT_FOUND', `Session not found: ${params.sessionId}`);
    }

    if (params.name !== undefined) {
      session.rename(params.name);
    }

    if (params.layout) {
      session.updateLayout(params.layout);
    }

    if (params.isActive === true) {
      session.activate();
    } else if (params.isActive === false) {
      session.deactivate();
    }

    await persistWorkspaceSessionState(
      session,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );

    return ok(session.toServerDTO());
  }
}
