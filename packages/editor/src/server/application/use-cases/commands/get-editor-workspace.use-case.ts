import type { IEditorWorkspaceRepository } from '../../../domain/repositories/i-editor-workspace-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { EditorWorkspaceServerDTO } from '@dailyuse/contracts/editor';

export class GetEditorWorkspaceUseCase {
  constructor(private readonly workspaceRepository: IEditorWorkspaceRepository) {}

  async execute(
    id: string,
    _options?: { includeSessions?: boolean },
  ): Promise<Result<EditorWorkspaceServerDTO | null>> {
    const workspace = await this.workspaceRepository.findById(id);
    return ok(workspace ? workspace.toServerDTO() : null);
  }
}
