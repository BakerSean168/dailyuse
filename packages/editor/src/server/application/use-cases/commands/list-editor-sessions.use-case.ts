import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { EditorSessionClientDTO } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

/**
 * ListEditorSessionsUseCase
 * Lists all sessions for a given workspace.
 */
export class ListEditorSessionsUseCase {
  constructor(private readonly sessionRepository: IEditorSessionRepository) {}

  async execute(workspaceId: string): Promise<Result<EditorSessionClientDTO[]>> {
    const sessions = await this.sessionRepository.findByWorkspaceId(workspaceId);
    return ok(sessions.map((s) => s.toClientDTO()));
  }
}
