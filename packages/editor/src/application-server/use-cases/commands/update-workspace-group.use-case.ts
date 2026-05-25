import type { IEditorGroupRepository } from '../../../domain-server/repositories/i-editor-group-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { EditorGroupServerDTO } from '@dailyuse/contracts/editor';
import type { SplitDirection } from '@dailyuse/contracts/editor';

export class UpdateWorkspaceGroupUseCase {
  constructor(private readonly groupRepository: IEditorGroupRepository) {}

  async execute(params: {
    workspaceId: string;
    sessionId: string;
    groupId: string;
    groupIndex?: number;
    name?: string;
    activeTabIndex?: number;
    splitDirection?: SplitDirection;
  }): Promise<Result<EditorGroupServerDTO>> {
    const group = await this.groupRepository.findById(params.groupId);
    if (!group) {
      return error('NOT_FOUND', `Group not found: ${params.groupId}`);
    }

    if (params.groupIndex !== undefined) {
      group.updateGroupIndex(params.groupIndex);
    }
    if (params.name !== undefined) {
      group.rename(params.name);
    }
    if (params.activeTabIndex !== undefined && params.activeTabIndex >= 0) {
      group.setActiveTab(params.activeTabIndex);
    }

    await this.groupRepository.save(group);

    return ok(group.toServerDTO());
  }
}
