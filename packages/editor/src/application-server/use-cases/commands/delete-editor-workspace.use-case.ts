import type { IEditorWorkspaceRepository } from '../../../domain-server/repositories/i-editor-workspace-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';

export class DeleteEditorWorkspaceUseCase {
  constructor(private readonly workspaceRepository: IEditorWorkspaceRepository) {}

  async execute(id: string): Promise<Result<boolean>> {
    const workspace = await this.workspaceRepository.findById(id);
    if (!workspace) {
      return ok(false);
    }

    workspace.delete();
    await this.workspaceRepository.deleteAggregate(workspace);
    return ok(true);
  }
}
