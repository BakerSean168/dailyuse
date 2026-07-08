import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { EditorSessionServerDTO } from '@dailyuse/contracts/editor';
import { loadWorkspaceSessionWithGroups } from './workspace-helpers';

export class GetWorkspaceSessionsUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(workspaceId: string): Promise<Result<EditorSessionServerDTO[]>> {
    const sessions = await this.sessionRepository.findByWorkspaceId(workspaceId);
    const restored = await Promise.all(
      sessions.map((session) =>
        loadWorkspaceSessionWithGroups(
          String(session.id),
          this.sessionRepository,
          this.groupRepository,
          this.tabRepository,
        ),
      ),
    );
    return ok(restored.filter(Boolean).map((session) => session!.toServerDTO()));
  }
}
