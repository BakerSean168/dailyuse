import type { IEditorSessionRepository } from '../../../domain-server/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain-server/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain-server/repositories/i-editor-tab-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { EditorSessionServerDTO } from '@dailyuse/contracts/editor';
import { loadWorkspaceSessionWithGroups } from './workspace-helpers';

export class GetWorkspaceSessionUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(sessionId: string): Promise<Result<EditorSessionServerDTO | null>> {
    const session = await loadWorkspaceSessionWithGroups(
      sessionId,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );
    return ok(session ? session.toServerDTO() : null);
  }
}
