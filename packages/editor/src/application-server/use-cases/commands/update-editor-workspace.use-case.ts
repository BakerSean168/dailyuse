import type { IEditorWorkspaceRepository } from '../../../domain-server/repositories/IEditorWorkspaceRepository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { EditorWorkspaceServerDTO } from '@dailyuse/contracts/editor';

export class UpdateEditorWorkspaceUseCase {
  constructor(private readonly workspaceRepository: IEditorWorkspaceRepository) {}

  async execute(params: {
    id: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<Result<EditorWorkspaceServerDTO>> {
    const workspace = await this.workspaceRepository.findById(params.id);
    if (!workspace) {
      return error('NOT_FOUND', `Workspace not found: ${params.id}`);
    }

    if (params.name !== undefined) {
      workspace.updateName(params.name);
    }
    if (params.description !== undefined) {
      workspace.updateDescription(params.description);
    }
    if (params.isActive !== undefined) {
      if (params.isActive) {
        workspace.activate();
      } else {
        workspace.deactivate();
      }
    }

    await this.workspaceRepository.save(workspace);

    return ok(workspace.toServerDTO());
  }
}
