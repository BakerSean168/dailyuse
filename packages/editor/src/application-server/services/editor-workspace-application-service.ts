import type { IEditorWorkspaceRepository } from '../../domain-server/repositories/IEditorWorkspaceRepository';
import type { IEditorSessionRepository } from '../../domain-server/repositories/IEditorSessionRepository';
import type { IEditorGroupRepository } from '../../domain-server/repositories/IEditorGroupRepository';
import type { IEditorTabRepository } from '../../domain-server/repositories/IEditorTabRepository';
import { EditorSession } from '../../domain-server/entities/editor-session';
import { EditorWorkspace } from '../../domain-server/aggregates/editor-workspace';
import { SessionRestorer } from '../../domain-server/services/SessionRestorer';
import type { 
  EditorWorkspaceServerDTO,
  WorkspaceLayoutServerDTO,
  WorkspaceSettingsServerDTO,
  EditorSessionServerDTO,
  SessionLayoutServerDTO,
  EditorGroupServerDTO,
  EditorTabServerDTO,
  TabViewStateServerDTO,
} from '@dailyuse/contracts/editor';
import { ProjectType, SplitDirection, TabType } from '@dailyuse/contracts/editor';

/**
 * EditorWorkspace 应用服务
 * 负责协调领域服务和仓储，处理业务用例
 *
 * 架构职责：
 * - 委托给 DomainService 处理业务逻辑
 * - 协调多个领域服务
 * - 事务管理
 * - DTO 转换（Domain ↔ Contracts）
 */
export class EditorWorkspaceApplicationService {
  private readonly sessionRepository: IEditorSessionRepository;
  private readonly groupRepository: IEditorGroupRepository;
  private readonly tabRepository: IEditorTabRepository;
  private readonly restorer: SessionRestorer;

  constructor(
    private readonly workspaceRepository: IEditorWorkspaceRepository,
    sessionRepository: IEditorSessionRepository,
    groupRepository: IEditorGroupRepository,
    tabRepository: IEditorTabRepository,
  ) {
    this.sessionRepository = sessionRepository;
    this.groupRepository = groupRepository;
    this.tabRepository = tabRepository;
    this.restorer = new SessionRestorer();
  }

  // ===== Workspace 管理 =====

  /**
   * 创建工作区
   */
  async createWorkspace(params: {
    accountUuid: string;
    name: string;
    description?: string;
    projectPath: string;
    projectType: ProjectType;
    layout?: Partial<WorkspaceLayoutServerDTO>;
    settings?: Partial<WorkspaceSettingsServerDTO>;
  }): Promise<EditorWorkspaceServerDTO> {
    // 委托给领域服务处理业务逻辑
    const workspace = EditorWorkspace.create({
      identityId: params.accountUuid,
      name: params.name,
      description: params.description,
      projectPath: params.projectPath,
      projectType: params.projectType,
      layout: params.layout as WorkspaceLayoutServerDTO | undefined,
      settings: params.settings as WorkspaceSettingsServerDTO | undefined,
    });

    await this.workspaceRepository.save(workspace);

    return workspace.toClientDTO();
  }

  /**
   * 获取工作区详情
   */
  async getWorkspace(
    uuid: string,
    options?: { includeSessions?: boolean },
  ): Promise<EditorWorkspaceServerDTO | null> {
    // 委托给领域服务处理
    const workspace = await this.workspaceRepository.findById(uuid);
    return workspace ? workspace.toClientDTO() : null;
  }

  /**
   * 获取账户的所有工作区
   */
  async getWorkspacesByAccount(
    accountUuid: string,
    options?: { includeSessions?: boolean },
  ): Promise<EditorWorkspaceServerDTO[]> {
    // 委托给领域服务处理
    const workspaces = await this.workspaceRepository.findByIdentityId(accountUuid);
    return workspaces.map((workspace) => workspace.toClientDTO());
  }

  /**
   * 更新工作区
   */
  async updateWorkspace(params: {
    uuid: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<EditorWorkspaceServerDTO> {
    // 委托给领域服务处理
    const workspace = await this.workspaceRepository.findById(params.uuid);
    if (!workspace) {
      throw new Error(`Workspace not found: ${params.uuid}`);
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

    return workspace.toClientDTO();
  }

  /**
   * 删除工作区
   */
  async deleteWorkspace(uuid: string): Promise<boolean> {
    // 委托给领域服务处理
    const workspace = await this.workspaceRepository.findById(uuid);
    if (!workspace) {
      return false;
    }

    await this.workspaceRepository.delete(uuid);
    return true;
  }

  // ===== Session 管理 =====

  /**
   * 添加会话到工作区
   */
  async addSession(params: {
    workspaceUuid: string;
    name: string;
    layout?: Partial<SessionLayoutServerDTO>;
  }): Promise<EditorSessionServerDTO> {
    const workspace = await this.workspaceRepository.findById(params.workspaceUuid);
    if (!workspace) {
      throw new Error(`Workspace not found: ${params.workspaceUuid}`);
    }

    const session = EditorSession.create({
      workspaceId: workspace.id,
      identityId: workspace.identityId,
      name: params.name,
      layout: params.layout ?? undefined,
    });

    await this.persistSessionState(session);

    return session.toServerDTO();
  }

  /**
   * 获取工作区的所有会话
   */
  async getSessions(workspaceUuid: string): Promise<EditorSessionServerDTO[]> {
    const sessions = await this.sessionRepository.findByWorkspaceId(workspaceUuid);
    const restored = await Promise.all(
      sessions.map((session) => this.loadSessionWithGroups(String(session.id))),
    );
    return restored.filter(Boolean).map((session) => session!.toServerDTO());
  }

  /**
   * 更新会话
   */
  async updateSession(params: {
    workspaceUuid: string;
    sessionUuid: string;
    name?: string;
    layout?: Partial<SessionLayoutServerDTO>;
    isActive?: boolean;
  }): Promise<EditorSessionServerDTO> {
    const session = await this.loadSessionWithGroups(params.sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${params.sessionUuid}`);
    }

    if (params.name !== undefined) {
      session.rename(params.name);
    }

    if (params.layout) {
      session.updateLayout(params.layout);
    }

    if (params.isActive === true) {
      session.activate();
    } else if (params.isActive === false) {
      session.deactivate();
    }

    await this.persistSessionState(session);

    return session.toServerDTO();
  }

  /**
   * 删除会话
   */
  async removeSession(workspaceUuid: string, sessionUuid: string): Promise<boolean> {
    const session = await this.sessionRepository.findById(sessionUuid);
    if (!session) {
      return false;
    }

    const groups = await this.groupRepository.findBySessionId(sessionUuid);
    for (const group of groups) {
      await this.tabRepository.deleteByGroupId(String(group.id));
    }
    await this.groupRepository.deleteBySessionId(sessionUuid);
    await this.sessionRepository.delete(sessionUuid);
    return true;
  }

  // ===== Group 管理 =====

  /**
   * 添加组到会话
   */
  async addGroup(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupIndex: number;
    name?: string;
  }): Promise<EditorGroupServerDTO> {
    const session = await this.loadSessionWithGroups(params.sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${params.sessionUuid}`);
    }

    const group = session.addGroup({
      groupIndex: params.groupIndex,
      name: params.name,
    });

    await this.persistSessionState(session);

    return group.toServerDTO();
  }

  /**
   * 更新组
   */
  async updateGroup(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupUuid: string;
    groupIndex?: number;
    name?: string;
    splitDirection?: SplitDirection;
  }): Promise<EditorGroupServerDTO> {
    const group = await this.groupRepository.findById(params.groupUuid);
    if (!group) {
      throw new Error(`Group not found: ${params.groupUuid}`);
    }

    if (params.groupIndex !== undefined) {
      group.updateGroupIndex(params.groupIndex);
    }
    if (params.name !== undefined) {
      group.rename(params.name);
    }

    await this.groupRepository.save(group);

    return group.toServerDTO();
  }

  /**
   * 删除组
   */
  async removeGroup(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
  ): Promise<boolean> {
    const session = await this.loadSessionWithGroups(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    session.removeGroup(groupUuid);
    await this.persistSessionState(session);
    return true;
  }

  // ===== Tab 管理 =====

  /**
   * 添加标签到组
   */
  async addTab(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupUuid: string;
    documentUuid?: string;
    tabIndex: number;
    tabType: TabType;
    title: string;
    viewState?: Partial<TabViewStateServerDTO>;
    isPinned?: boolean;
  }): Promise<EditorTabServerDTO> {
    const session = await this.loadSessionWithGroups(params.sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${params.sessionUuid}`);
    }

    const tab = session.openTab(params.documentUuid ?? '', {
      groupId: params.groupUuid,
      tabType: params.tabType,
      viewState: params.viewState,
      name: params.title,
      isPinned: params.isPinned,
    });

    await this.persistSessionState(session);

    return tab.toServerDTO();
  }

  /**
   * 更新标签
   */
  async updateTab(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupUuid: string;
    tabUuid: string;
    tabIndex?: number;
    title?: string;
    viewState?: Partial<TabViewStateServerDTO>;
    isPinned?: boolean;
  }): Promise<EditorTabServerDTO> {
    const tab = await this.tabRepository.findById(params.tabUuid);
    if (!tab) {
      throw new Error(`Tab not found: ${params.tabUuid}`);
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

    await this.tabRepository.save(tab);

    return tab.toServerDTO();
  }

  /**
   * 删除标签
   */
  async removeTab(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
  ): Promise<boolean> {
    const session = await this.loadSessionWithGroups(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    session.closeTab(tabUuid);
    await this.persistSessionState(session);
    return true;
  }

  // ===== 激活状态管理 =====

  /**
   * 激活会话
   */
  async activateSession(workspaceUuid: string, sessionUuid: string): Promise<void> {
    const session = await this.loadSessionWithGroups(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    session.activate();
    await this.persistSessionState(session);
  }

  /**
   * 停用会话
   */
  async deactivateSession(workspaceUuid: string, sessionUuid: string): Promise<void> {
    const session = await this.loadSessionWithGroups(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    session.deactivate();
    await this.persistSessionState(session);
  }

  /**
   * 激活标签
   */
  async activateTab(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
  ): Promise<void> {
    const session = await this.loadSessionWithGroups(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    session.setActiveTab(tabUuid);
    await this.persistSessionState(session);
  }

  /**
   * 停用标签
   */
  async deactivateTab(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
  ): Promise<void> {
    const session = await this.loadSessionWithGroups(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    session.setActiveTab(tabUuid);
    await this.persistSessionState(session);
  }

  private async persistSessionState(session: EditorSession): Promise<void> {
    await this.sessionRepository.save(session);

    if (session.groups.length > 0) {
      await this.groupRepository.saveBatch(session.groups);
      const tabs = session.groups.flatMap((group) => group.tabs);
      if (tabs.length > 0) {
        await this.tabRepository.saveBatch(tabs);
      }
    }
  }

  private async loadSessionWithGroups(sessionId: string): Promise<EditorSession | null> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      return null;
    }

    const groups = await this.groupRepository.findBySessionId(sessionId);
    for (const group of groups) {
      const tabs = await this.tabRepository.findByGroupId(String(group.id));
      group.restoreTabs(tabs);
    }

    return this.restorer.restore(session, groups);
  }
}




