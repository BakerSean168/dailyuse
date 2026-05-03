import type { IEditorSessionRepository } from '../../../domain-server/repositories/IEditorSessionRepository';
import type { IEditorWorkspaceRepository } from '../../../domain-server/repositories/IEditorWorkspaceRepository';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/IEditorGroupRepository';
import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';
import type { CreateEditorSessionRequest, EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { EditorSession } from '../../../domain-server/entities/editor-session';
import { persistSessionState } from './editor-session-helpers';

/**
 * CreateEditorSessionUseCase
 * Creates a new editor session for a workspace.
 */
export class CreateEditorSessionUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly workspaceRepository: IEditorWorkspaceRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(
    identityId: string,
    request: CreateEditorSessionRequest,
  ): Promise<Result<EditorSessionClientDTO>> {
    const workspace = await this.workspaceRepository.findById(request.workspaceId);
    if (!workspace) {
      return error('NOT_FOUND', `工作区不存在: ${request.workspaceId}`);
    }

    const session = EditorSession.create({
      workspaceId: workspace.id,
      identityId: workspace.identityId,
      name: request.name,
      description: request.description ?? undefined,
      layout: request.layout ?? undefined,
    });

    await persistSessionState(session, this.sessionRepository, this.groupRepository, this.tabRepository);

    return ok(session.toClientDTO());
  }
}
