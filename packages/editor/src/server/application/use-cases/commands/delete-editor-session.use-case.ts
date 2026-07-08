import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { loadSessionWithGroups } from './editor-session-helpers';

/**
 * DeleteEditorSessionUseCase
 * Deletes a session and all its groups and tabs.
 */
export class DeleteEditorSessionUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(id: string): Promise<Result<void>> {
    const session = await loadSessionWithGroups(id, this.sessionRepository, this.groupRepository, this.tabRepository);
    if (!session) {
      return error('NOT_FOUND', `会话不存在: ${id}`);
    }

    const groups = await this.groupRepository.findBySessionId(id);
    for (const group of groups) {
      await this.tabRepository.deleteByGroupId(String(group.id));
    }
    await this.groupRepository.deleteBySessionId(id);

    await this.sessionRepository.delete(id);

    return ok(undefined);
  }
}
