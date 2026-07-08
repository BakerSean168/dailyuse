import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import type { UpdateEditorSessionRequest, EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { loadSessionWithGroups, persistSessionState } from './editor-session-helpers';

/**
 * UpdateEditorSessionUseCase
 * Updates an existing editor session's name, description, layout, or active group.
 */
export class UpdateEditorSessionUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(
    id: string,
    request: UpdateEditorSessionRequest,
  ): Promise<Result<EditorSessionClientDTO>> {
    const session = await loadSessionWithGroups(id, this.sessionRepository, this.groupRepository, this.tabRepository);
    if (!session) {
      return error('NOT_FOUND', `会话不存在: ${id}`);
    }

    if (request.name) {
      session.rename(request.name);
    }

    if (request.description !== undefined) {
      session.updateDescription(request.description);
    }

    if (request.activeGroupIndex !== undefined) {
      session.setActiveGroup(request.activeGroupIndex);
    }

    if (request.layout) {
      session.updateLayout(request.layout);
    }

    await persistSessionState(session, this.sessionRepository, this.groupRepository, this.tabRepository);

    return ok(session.toClientDTO());
  }
}
