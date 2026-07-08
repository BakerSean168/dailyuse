import type { IEditorSessionRepository } from '../../../domain/repositories/i-editor-session-repository';
import type { IEditorGroupRepository } from '../../../domain/repositories/i-editor-group-repository';
import type { IEditorTabRepository } from '../../../domain/repositories/i-editor-tab-repository';
import type { EditorSessionClientDTO, TabViewStateDTO, TabType } from '@dailyuse/contracts/editor';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import { EditorPolicy } from '../../../domain/services/editor-policy';
import { SessionRestorer } from '../../../domain/services/session-restorer';
import type { IRepositoryContentPort } from '../../ports/i-repository-content-port';
import { loadSessionWithGroups, persistSessionState, countOpenTabs } from './editor-session-helpers';

export interface OpenEditorTabParams {
  sessionId: string;
  resourceId: string;
  tabType?: TabType;
  viewState?: Partial<TabViewStateDTO>;
  maxOpenTabs?: number;
  allowedExtensions?: string[];
}

/**
 * OpenEditorTabUseCase
 * Opens a resource as a new tab in a session, enforcing policy rules.
 */
export class OpenEditorTabUseCase {
  private readonly policy = new EditorPolicy();
  private readonly restorer = new SessionRestorer();

  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
    private readonly repositoryContentPort: IRepositoryContentPort,
  ) {}

  async execute(params: OpenEditorTabParams): Promise<Result<EditorSessionClientDTO>> {
    const session = await loadSessionWithGroups(params.sessionId, this.sessionRepository, this.groupRepository, this.tabRepository);
    if (!session) {
      return error('NOT_FOUND', `会话不存在: ${params.sessionId}`);
    }

    const content = await this.repositoryContentPort.getContent(params.resourceId);

    try {
      this.policy.assertOpenTabLimit(countOpenTabs(session), {
        maxOpenTabs: params.maxOpenTabs,
      });
      this.policy.assertFileTypeAllowed(content.name, {
        allowedExtensions: params.allowedExtensions,
      });
    } catch (err) {
      return error('BUSINESS_RULE_VIOLATION', (err as Error).message);
    }

    session.openTab(params.resourceId, {
      tabType: params.tabType,
      viewState: params.viewState,
      name: content.name,
    });

    await persistSessionState(session, this.sessionRepository, this.groupRepository, this.tabRepository);
    return ok(this.restorer.restore(session).toClientDTO());
  }
}
