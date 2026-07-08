import type { IEditorWorkspaceRepository } from '../../../domain/repositories/i-editor-workspace-repository';
import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import { EditorSession } from '../../../domain/entities/editor-session';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { EditorSessionServerDTO, SessionLayoutDTO } from '@dailyuse/contracts/editor';
import { persistWorkspaceSessionState } from './workspace-helpers';

export class AddWorkspaceSessionUseCase {
  constructor(
    private readonly workspaceRepository: IEditorWorkspaceRepository,
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(params: {
    workspaceId: string;
    name: string;
    layout?: Partial<SessionLayoutDTO>;
  }): Promise<Result<EditorSessionServerDTO>> {
    const workspace = await this.workspaceRepository.findById(params.workspaceId);
    if (!workspace) {
      return error('NOT_FOUND', `Workspace not found: ${params.workspaceId}`);
    }

    const session = EditorSession.create({
      workspaceId: workspace.id,
      identityId: workspace.identityId,
      name: params.name,
      layout: params.layout ?? undefined,
    });

    await persistWorkspaceSessionState(
      session,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );

    return ok(session.toServerDTO());
  }
}
