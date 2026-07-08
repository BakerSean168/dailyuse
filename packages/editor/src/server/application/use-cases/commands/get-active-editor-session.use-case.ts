import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * GetActiveEditorSessionUseCase
 * Retrieves the currently active session for a workspace.
 */
export class GetActiveEditorSessionUseCase {
  constructor(private readonly sessionRepository: IEditorSessionRepository) {}

  async execute(workspaceId: string): Promise<Result<EditorSessionClientDTO | null>> {
    const session = await this.sessionRepository.findActiveByWorkspaceId(workspaceId);
    return ok(session ? session.toClientDTO() : null);
  }
}
