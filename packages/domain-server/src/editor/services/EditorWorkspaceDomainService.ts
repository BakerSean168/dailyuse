/**
 * EditorWorkspace 领域服务
 *
 * DDD 领域服务职责：
 * - 跨聚合根的业务逻辑
 * - 协调多个聚合根
 * - 使用仓储接口进行持久化
 * - 触发领域事件
 */

import type { IEditorWorkspaceRepository } from '../repositories/IEditorWorkspaceRepository';
import { EditorWorkspace } from '../aggregates/EditorWorkspace';
import { EditorSession } from '../entities/EditorSession';
import { EditorGroup } from '../entities/EditorGroup';
import { EditorTab } from '../entities/EditorTab';
import type { SessionLayoutServerDTO, SplitDirection, TabViewStateServerDTO, WorkspaceLayoutServerDTO, WorkspaceSettingsServerDTO } from '@dailyuse/contracts/editor';
import { ProjectType, TabType } from '@dailyuse/contracts/editor';

/**
 * EditorWorkspaceDomainService
 *
 * 注意：
 * - 通过构造函数注入仓储接口
 * - 不直接操作数据库
 * - 业务逻辑在聚合根/实体中，服务只是协调
 */
export class EditorWorkspaceDomainService {
  constructor(
    private readonly workspaceRepo: IEditorWorkspaceRepository,
    // 可以注入其他仓储或服务
    // private readonly eventBus: IEventBus,
  ) {}

  // ===== Workspace 管理 =====

  /**
   * 创建新的工作区
   */
  public async createWorkspace(params: {
    accountUuid: string;
    name: string;
    description?: string;
    projectPath: string;
    projectType: ProjectType;
    layout?: Partial<WorkspaceLayoutServerDTO>;
    settings?: Partial<WorkspaceSettingsServerDTO>;
  }): Promise<EditorWorkspace> {
    // 1. 创建聚合根（业务逻辑在聚合根中）
    const workspace = EditorWorkspace.create(params);

    // 2. 持久化
    await this.workspaceRepo.save(workspace);

    // 3. 触发领域事件（可选）
    // await this.eventBus.publish({
    //   type: 'workspace.created',
    //   aggregateId: workspace.uuid,
    //   timestamp: Date.now(),
    //   payload: { workspace: workspace.toServerDTO() },
    // });

    return workspace;
  }

  /**
   * 获取工作区（支持懒加载和急加载）
   */
  public async getWorkspace(
    uuid: string,
    options?: { includeSessions?: boolean },
  ): Promise<EditorWorkspace | null> {
    const workspace = await this.workspaceRepo.findByUuid(uuid);

    if (workspace) {
      // 更新访问时间
      workspace.recordAccess();
      await this.workspaceRepo.save(workspace);
    }

    return workspace;
  }

  /**
   * 获取账户的所有工作区
   */
  public async getWorkspacesByAccount(
    accountUuid: string,
    options?: { includeSessions?: boolean },
  ): Promise<EditorWorkspace[]> {
    return await this.workspaceRepo.findByAccountUuid(accountUuid);
  }

  /**
   * 更新工作区
   */
  public async updateWorkspace(params: {
    uuid: string;
    name?: string;
    description?: string;
    isActive?: boolean;
  }): Promise<EditorWorkspace> {
    const workspace = await this.workspaceRepo.findByUuid(params.uuid);
    if (!workspace) {
      throw new Error(`Workspace not found: ${params.uuid}`);
    }

    // 业务逻辑在聚合根中
    if (params.name !== undefined || params.description !== undefined) {
      workspace.update({
        name: params.name,
        description: params.description,
      });
    }
    if (params.isActive !== undefined) {
      if (params.isActive) {
        workspace.activate();
      } else {
        workspace.deactivate();
      }
    }

    await this.workspaceRepo.save(workspace);

    return workspace;
  }

  /**
   * 删除工作区
   */
  public async deleteWorkspace(uuid: string): Promise<boolean> {
    const workspace = await this.workspaceRepo.findByUuid(uuid);

    if (!workspace) {
      return false;
    }

    // 检查是否有活跃的会话
    // Check if has sessions
    const sessions = workspace.getAllSessions();
    if (sessions.length > 0) {
      console.warn(`Deleting workspace with ${sessions.length} sessions`);
    }

    await this.workspaceRepo.delete(uuid);

    return true;
  }

  // ===== Session 管理 =====

  /**
   * 添加会话到工作区
   */
  public async addSession(params: {
    workspaceUuid: string;
    name: string;
    layout?: Partial<SessionLayoutServerDTO>;
  }): Promise<EditorSession> {
    const workspace = await this.workspaceRepo.findByUuid(params.workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${params.workspaceUuid}`);
    }

    // 业务逻辑在聚合根中
    const session = workspace.addSession({
      name: params.name,
      layout: params.layout,
    });

    await this.workspaceRepo.save(workspace);

    return session;
  }

  /**
   * 获取工作区的所有会话
   */
  public async getSessions(workspaceUuid: string): Promise<EditorSession[]> {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceUuid}`);
    }

    return workspace.getAllSessions();
  }

  /**
   * 更新会话
   */
  public async updateSession(params: {
    workspaceUuid: string;
    sessionUuid: string;
    name?: string;
    layout?: Partial<SessionLayoutServerDTO>;
    isActive?: boolean;
  }): Promise<EditorSession> {
    const workspace = await this.workspaceRepo.findByUuid(params.workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${params.workspaceUuid}`);
    }

    const session = workspace.getSession(params.sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${params.sessionUuid}`);
    }

    // 业务逻辑在实体中
    if (params.name !== undefined) {
      session.update({ name: params.name });
    }
    if (params.layout !== undefined) {
      session.updateLayout(params.layout);
    }
    if (params.isActive !== undefined) {
      if (params.isActive) {
        session.activate();
      } else {
        session.deactivate();
      }
    }

    await this.workspaceRepo.save(workspace);

    return session;
  }

  /**
   * 删除会话
   */
  public async removeSession(workspaceUuid: string, sessionUuid: string): Promise<boolean> {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceUuid}`);
    }

    const result = workspace.removeSession(sessionUuid);
    if (result) {
      await this.workspaceRepo.save(workspace);
    }

    return result;
  }

  // ===== Group 管理 =====

  /**
   * 添加组到会话
   */
  public async addGroup(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupIndex: number;
    name?: string;
  }): Promise<EditorGroup> {
    const workspace = await this.workspaceRepo.findByUuid(params.workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${params.workspaceUuid}`);
    }

    const session = workspace.getSession(params.sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${params.sessionUuid}`);
    }

    // 业务逻辑在实体中
    const group = session.addGroup({
      groupIndex: params.groupIndex,
      name: params.name,
    });

    await this.workspaceRepo.save(workspace);

    return group;
  }

  /**
   * 更新组
   */
  public async updateGroup(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupUuid: string;
    groupIndex?: number;
    name?: string;
    splitDirection?: SplitDirection;
  }): Promise<EditorGroup> {
    const workspace = await this.workspaceRepo.findByUuid(params.workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${params.workspaceUuid}`);
    }

    const session = workspace.getSession(params.sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${params.sessionUuid}`);
    }

    const group = session.getGroup(params.groupUuid);
    if (!group) {
      throw new Error(`Group not found: ${params.groupUuid}`);
    }

    // 业务逻辑在实体中
    if (params.groupIndex !== undefined) {
      group.updateGroupIndex(params.groupIndex);
    }
    if (params.name !== undefined) {
      group.rename(params.name);
    }
    // Note: splitDirection cannot be updated after creation

    await this.workspaceRepo.save(workspace);

    return group;
  }

  /**
   * 删除组
   */
  public async removeGroup(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
  ): Promise<boolean> {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceUuid}`);
    }

    const session = workspace.getSession(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    session.removeGroup(groupUuid);
    await this.workspaceRepo.save(workspace);
    return true;
  }

  // ===== Tab 管理 =====

  /**
   * 添加标签到组
   */
  public async addTab(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupUuid: string;
    documentUuid?: string;
    tabIndex: number;
    tabType: TabType;
    name: string;
    viewState?: Partial<TabViewStateServerDTO>;
    isPinned?: boolean;
  }): Promise<EditorTab> {
    const workspace = await this.workspaceRepo.findByUuid(params.workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${params.workspaceUuid}`);
    }

    const session = workspace.getSession(params.sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${params.sessionUuid}`);
    }

    const group = session.getGroup(params.groupUuid);
    if (!group) {
      throw new Error(`Group not found: ${params.groupUuid}`);
    }

    // 业务逻辑在实体中
    const tab = group.addTab({
      documentUuid: params.documentUuid,
      tabIndex: params.tabIndex,
      tabType: params.tabType,
      name: params.name,
      viewState: params.viewState,
      isPinned: params.isPinned,
    });

    await this.workspaceRepo.save(workspace);

    return tab;
  }

  /**
   * 更新标签
   */
  public async updateTab(params: {
    workspaceUuid: string;
    sessionUuid: string;
    groupUuid: string;
    tabUuid: string;
    tabIndex?: number;
    name?: string;
    viewState?: Partial<TabViewStateServerDTO>;
    isPinned?: boolean;
  }): Promise<EditorTab> {
    const workspace = await this.workspaceRepo.findByUuid(params.workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${params.workspaceUuid}`);
    }

    const session = workspace.getSession(params.sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${params.sessionUuid}`);
    }

    const group = session.getGroup(params.groupUuid);
    if (!group) {
      throw new Error(`Group not found: ${params.groupUuid}`);
    }

    const tab = group.getTab(params.tabUuid);
    if (!tab) {
      throw new Error(`Tab not found: ${params.tabUuid}`);
    }

    // 业务逻辑在实体中
    if (params.tabIndex !== undefined) {
      tab.updateTabIndex(params.tabIndex);
    }
    if (params.name !== undefined) {
      tab.updateName(params.name);
    }
    if (params.viewState !== undefined) {
      tab.updateViewState(params.viewState);
    }
    if (params.isPinned !== undefined) {
      // Toggle pin only if current state differs from desired state
      if (tab.isPinned !== params.isPinned) {
        tab.togglePin();
      }
    }

    await this.workspaceRepo.save(workspace);

    return tab;
  }

  /**
   * 删除标签
   */
  public async removeTab(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
  ): Promise<boolean> {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceUuid}`);
    }

    const session = workspace.getSession(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    const group = session.getGroup(groupUuid);
    if (!group) {
      throw new Error(`Group not found: ${groupUuid}`);
    }

    const result = group.removeTab(tabUuid);
    if (result) {
      await this.workspaceRepo.save(workspace);
    }

    return result;
  }

  // ===== 激活状态管理 =====

  /**
   * 激活会话
   */
  public async activateSession(workspaceUuid: string, sessionUuid: string): Promise<void> {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceUuid}`);
    }

    const session = workspace.getSession(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    session.activate();
    await this.workspaceRepo.save(workspace);
  }

  /**
   * 停用会话
   */
  public async deactivateSession(workspaceUuid: string, sessionUuid: string): Promise<void> {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceUuid}`);
    }

    const session = workspace.getSession(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    session.deactivate();
    await this.workspaceRepo.save(workspace);
  }

  /**
   * 激活标签
   */
  public async activateTab(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceUuid}`);
    }

    const session = workspace.getSession(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    const group = session.getGroup(groupUuid);
    if (!group) {
      throw new Error(`Group not found: ${groupUuid}`);
    }

    const tab = group.getTab(tabUuid);
    if (!tab) {
      throw new Error(`Tab not found: ${tabUuid}`);
    }

    // Note: Tab activation is managed at session level
    await this.workspaceRepo.save(workspace);
  }

  /**
   * 停用标签
   */
  public async deactivateTab(
    workspaceUuid: string,
    sessionUuid: string,
    groupUuid: string,
    tabUuid: string,
  ): Promise<void> {
    const workspace = await this.workspaceRepo.findByUuid(workspaceUuid);

    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceUuid}`);
    }

    const session = workspace.getSession(sessionUuid);
    if (!session) {
      throw new Error(`Session not found: ${sessionUuid}`);
    }

    const group = session.getGroup(groupUuid);
    if (!group) {
      throw new Error(`Group not found: ${groupUuid}`);
    }

    const tab = group.getTab(tabUuid);
    if (!tab) {
      throw new Error(`Tab not found: ${tabUuid}`);
    }

    // Note: Tab deactivation is managed at session level
    await this.workspaceRepo.save(workspace);
  }
}
