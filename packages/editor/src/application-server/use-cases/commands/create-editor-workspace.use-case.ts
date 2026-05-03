import type { IEditorWorkspaceRepository } from '../../../domain-server/repositories/IEditorWorkspaceRepository';
import { EditorWorkspace } from '../../../domain-server/aggregates/editor-workspace';
import { IdentityId as IdentityIdType } from '@dailyuse/domain-shared/shared';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type {
  EditorWorkspaceServerDTO,
  WorkspaceLayoutServerDTO,
  WorkspaceSettingsServerDTO,
} from '@dailyuse/contracts/editor';
import type { ProjectType } from '@dailyuse/contracts/editor';

export class CreateEditorWorkspaceUseCase {
  constructor(private readonly workspaceRepository: IEditorWorkspaceRepository) {}

  async execute(params: {
    identityId: string;
    name: string;
    description?: string;
    projectPath: string;
    projectType: ProjectType;
    layout?: Partial<WorkspaceLayoutServerDTO>;
    settings?: Partial<WorkspaceSettingsServerDTO>;
  }): Promise<Result<EditorWorkspaceServerDTO>> {
    const workspace = EditorWorkspace.create({
      identityId: IdentityIdType.of(params.identityId),
      name: params.name,
      description: params.description,
      projectPath: params.projectPath,
      projectType: params.projectType,
      layout: params.layout as WorkspaceLayoutServerDTO | undefined,
      settings: params.settings as WorkspaceSettingsServerDTO | undefined,
    });

    await this.workspaceRepository.save(workspace);

    return ok(workspace.toServerDTO());
  }
}
