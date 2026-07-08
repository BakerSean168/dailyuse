import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class RemoveWorkspaceSessionUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(workspaceId: string, sessionId: string): Promise<Result<boolean>> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      return ok(false);
    }

    const groups = await this.groupRepository.findBySessionId(sessionId);
    for (const group of groups) {
      await this.tabRepository.deleteByGroupId(String(group.id));
    }
    await this.groupRepository.deleteBySessionId(sessionId);
    await this.sessionRepository.delete(sessionId);
    return ok(true);
  }
}
