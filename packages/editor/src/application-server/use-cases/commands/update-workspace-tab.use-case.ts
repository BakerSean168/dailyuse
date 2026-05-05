import type { IEditorTabRepository } from '../../../domain-server/repositories/IEditorTabRepository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { EditorTabServerDTO, TabViewStateDTO } from '@dailyuse/contracts/editor';

export class UpdateWorkspaceTabUseCase {
  constructor(private readonly tabRepository: IEditorTabRepository) {}

  async execute(params: {
    workspaceId: string;
    sessionId: string;
    groupId: string;
    tabId: string;
    tabIndex?: number;
    title?: string;
    viewState?: Partial<TabViewStateDTO>;
    isPinned?: boolean;
    isDirty?: boolean;
  }): Promise<Result<EditorTabServerDTO>> {
    const tab = await this.tabRepository.findById(params.tabId);
    if (!tab) {
      return error('NOT_FOUND', `Tab not found: ${params.tabId}`);
    }

    if (params.tabIndex !== undefined) {
      tab.updateTabIndex(params.tabIndex);
    }
    if (params.title !== undefined) {
      tab.updateName(params.title);
    }
    if (params.viewState !== undefined) {
      tab.updateViewState(params.viewState);
    }
    if (params.isPinned !== undefined && tab.isPinned !== params.isPinned) {
      tab.togglePinned();
    }
    if (params.isDirty !== undefined && tab.isDirty !== params.isDirty) {
      if (params.isDirty) {
        tab.markDirty();
      } else {
        tab.markClean();
      }
    }

    await this.tabRepository.save(tab);

    return ok(tab.toServerDTO());
  }
}
