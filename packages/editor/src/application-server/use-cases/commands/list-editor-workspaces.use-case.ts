import type { IEditorWorkspaceRepository } from '../../../domain-server/repositories/IEditorWorkspaceRepository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { EditorWorkspaceServerDTO } from '@dailyuse/contracts/editor';

export class ListEditorWorkspacesUseCase {
  constructor(private readonly workspaceRepository: IEditorWorkspaceRepository) {}

  async execute(
    identityId: string,
    _options?: { includeSessions?: boolean },
  ): Promise<Result<EditorWorkspaceServerDTO[]>> {
    const workspaces = await this.workspaceRepository.findByIdentityId(identityId);
    return ok(workspaces.map((workspace) => workspace.toServerDTO()));
  }
}
