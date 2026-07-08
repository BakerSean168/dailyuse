import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import type { EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import { loadSessionWithGroups } from './editor-session-helpers';

/**
 * GetEditorSessionUseCase
 * Retrieves a single editor session by ID with all groups and tabs hydrated.
 */
export class GetEditorSessionUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(id: string): Promise<Result<EditorSessionClientDTO | null>> {
    const session = await loadSessionWithGroups(id, this.sessionRepository, this.groupRepository, this.tabRepository);
    return ok(session ? session.toClientDTO() : null);
  }
}
