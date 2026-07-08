import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { EditorTabServerDTO, TabViewStateDTO, TabType } from '@dailyuse/contracts/editor';
import { loadWorkspaceSessionWithGroups, persistWorkspaceSessionState } from './workspace-helpers';

export class AddWorkspaceTabUseCase {
  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
  ) {}

  async execute(params: {
    workspaceId: string;
    sessionId: string;
    groupId: string;
    resourceId?: string;
    tabIndex: number;
    tabType: TabType;
    title: string;
    viewState?: Partial<TabViewStateDTO>;
    isPinned?: boolean;
  }): Promise<Result<EditorTabServerDTO>> {
    const session = await loadWorkspaceSessionWithGroups(
      params.sessionId,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );
    if (!session) {
      return error('NOT_FOUND', `Session not found: ${params.sessionId}`);
    }

    const tab = session.openTab(params.resourceId ?? '', {
      groupId: params.groupId,
      tabType: params.tabType,
      viewState: params.viewState,
      name: params.title,
      isPinned: params.isPinned,
    });

    await persistWorkspaceSessionState(
      session,
      this.sessionRepository,
      this.groupRepository,
      this.tabRepository,
    );

    return ok(tab.toServerDTO());
  }
}
