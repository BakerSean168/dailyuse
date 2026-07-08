import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { EditorGroupServerDTO } from '@dailyuse/contracts/editor';
import { loadWorkspaceSessionWithGroups, persistWorkspaceSessionState } from './workspace-helpers';

export class AddWorkspaceGroupUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(params: {
    workspaceId: string;
    sessionId: string;
    groupIndex: number;
    name?: string;
  }): Promise<Result<EditorGroupServerDTO>> {
    const session = await loadWorkspaceSessionWithGroups(
      params.sessionId,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );
    if (!session) {
      return error('NOT_FOUND', `Session not found: ${params.sessionId}`);
    }

    const group = session.addGroup({
      groupIndex: params.groupIndex,
      name: params.name,
    });

    await persistWorkspaceSessionState(
      session,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );

    return ok(group.toServerDTO());
  }
}
