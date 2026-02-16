/**
 * EditorSessionApplicationService
 * 编辑器会话应用服务
 */

import type { IEditorSessionRepository } from '../../domain-server/repositories/IEditorSessionRepository';
import type { IEditorWorkspaceRepository } from '../../domain-server/repositories/IEditorWorkspaceRepository';
import type { IEditorGroupRepository } from '../../domain-server/repositories/IEditorGroupRepository';
import type { IEditorTabRepository } from '../../domain-server/repositories/IEditorTabRepository';
import type { CreateEditorSessionRequest, EditorSessionClientDTO, UpdateEditorSessionRequest } from '@dailyuse/contracts/editor';
import { EditorSession } from '../../domain-server/entities/editor-session';
import { SessionLayout } from '../../domain-server/value-objects/SessionLayout';
import { EditorPolicy } from '../../domain-server/services/EditorPolicy';
import { SessionRestorer } from '../../domain-server/services/SessionRestorer';
import type { IRepositoryContentPort } from '../ports/IRepositoryContentPort';
import type { TabViewStateServerDTO, TabType } from '@dailyuse/contracts/editor';

/**
 * EditorSession 应用服务
 */
export class EditorSessionApplicationService {
  private readonly policy: EditorPolicy;
  private readonly restorer: SessionRestorer;

  constructor(
    private readonly sessionRepository: IEditorSessionRepository,
    private readonly workspaceRepository: IEditorWorkspaceRepository,
    private readonly groupRepository: IEditorGroupRepository,
    private readonly tabRepository: IEditorTabRepository,
    private readonly repositoryContentPort: IRepositoryContentPort,
  ) {
    this.policy = new EditorPolicy();
    this.restorer = new SessionRestorer();
  }

  /**
   * 创建新会话
   */
  async createSession(
    accountUuid: string,
    request: CreateEditorSessionRequest,
  ): Promise<EditorSessionClientDTO> {
    // 检查工作区是否存在
    const workspace = await this.workspaceRepository.findById(request.workspaceUuid);
    if (!workspace) {
      throw new Error(`工作区不存在: ${request.workspaceUuid}`);
    }

    // 创建会话
    const session = EditorSession.create({
      workspaceId: workspace.id,
      identityId: workspace.identityId,
      name: request.name,
      description: request.description ?? undefined,
      layout: request.layout ?? undefined,
    });

    // 保存
    await this.persistSessionState(session);

    return session.toClientDTO();
  }

  /**
   * 更新会话
   */
  async updateSession(uuid: string, request: UpdateEditorSessionRequest): Promise<EditorSessionClientDTO> {
    const session = await this.loadSessionWithGroups(uuid);
    if (!session) {
      throw new Error(`会话不存在: ${uuid}`);
    }

    // 更新基本信息
    if (request.name) {
      session.rename(request.name);
    }

    if (request.description !== undefined) {
      session.updateDescription(request.description);
    }

    // 更新活动分组
    if (request.activeGroupIndex !== undefined) {
      session.setActiveGroup(request.activeGroupIndex);
    }

    if (request.layout) {
      const currentLayout = session.layout;
      const layout = SessionLayout.fromServerDTO({
        ...currentLayout,
        ...request.layout,
      });
      session.updateLayout(layout);
    }

    await this.persistSessionState(session);

    return session.toClientDTO();
  }

  /**
   * 激活会话
   */
  async activateSession(uuid: string, workspaceUuid: string): Promise<EditorSessionClientDTO> {
    const session = await this.loadSessionWithGroups(uuid);
    if (!session) {
      throw new Error(`会话不存在: ${uuid}`);
    }

    // 取消其他会话的激活状态
    const activeSession = await this.sessionRepository.findActiveByWorkspaceId(workspaceUuid);
    if (activeSession && activeSession.id !== uuid) {
      activeSession.deactivate();
      await this.sessionRepository.save(activeSession);
    }

    // 激活当前会话
    session.activate();
    await this.persistSessionState(session);

    return session.toClientDTO();
  }

  /**
   * 删除会话
   */
  async deleteSession(uuid: string): Promise<void> {
    const session = await this.loadSessionWithGroups(uuid);
    if (!session) {
      throw new Error(`会话不存在: ${uuid}`);
    }

    // 删除所有分组和标签
    const groups = await this.groupRepository.findBySessionId(uuid);
    for (const group of groups) {
      await this.tabRepository.deleteByGroupId(String(group.id));
    }
    await this.groupRepository.deleteBySessionId(uuid);

    // 删除会话
    await this.sessionRepository.delete(uuid);
  }

  /**
   * 获取会话详情
   */
  async getSession(uuid: string): Promise<EditorSessionClientDTO | null> {
    const session = await this.loadSessionWithGroups(uuid);
    return session ? session.toClientDTO() : null;
  }

  /**
   * 获取工作区的所有会话
   */
  async listSessions(workspaceUuid: string): Promise<EditorSessionClientDTO[]> {
    const sessions = await this.sessionRepository.findByWorkspaceId(workspaceUuid);
    return sessions.map((s) => s.toClientDTO());
  }

  /**
   * 获取活动会话
   */
  async getActiveSession(workspaceUuid: string): Promise<EditorSessionClientDTO | null> {
    const session = await this.sessionRepository.findActiveByWorkspaceId(workspaceUuid);
    return session ? session.toClientDTO() : null;
  }

  /**
   * 添加分组
   */
  async addGroup(sessionUuid: string, name?: string): Promise<EditorSessionClientDTO> {
    const session = await this.loadSessionWithGroups(sessionUuid);
    if (!session) {
      throw new Error(`会话不存在: ${sessionUuid}`);
    }

    const groupCount = await this.groupRepository.countBySessionId(sessionUuid);
    session.addGroup({ groupIndex: groupCount, name: name ?? undefined });

    await this.persistSessionState(session);

    return session.toClientDTO();
  }

  /**
   * 移除分组
   */
  async removeGroup(sessionUuid: string, groupUuid: string): Promise<EditorSessionClientDTO> {
    const session = await this.loadSessionWithGroups(sessionUuid);
    if (!session) {
      throw new Error(`会话不存在: ${sessionUuid}`);
    }

    session.removeGroup(groupUuid);

    await this.persistSessionState(session);

    return session.toClientDTO();
  }

  /**
   * 打开资源标签
   */
  async openTab(params: {
    sessionId: string;
    resourceId: string;
    tabType?: TabType;
    viewState?: Partial<TabViewStateServerDTO>;
    maxOpenTabs?: number;
    allowedExtensions?: string[];
  }): Promise<EditorSessionClientDTO> {
    const session = await this.loadSessionWithGroups(params.sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${params.sessionId}`);
    }

    const content = await this.repositoryContentPort.getContent(params.resourceId);

    this.policy.assertOpenTabLimit(this.countOpenTabs(session), {
      maxOpenTabs: params.maxOpenTabs,
    });
    this.policy.assertFileTypeAllowed(content.name, {
      allowedExtensions: params.allowedExtensions,
    });

    session.openTab(params.resourceId, {
      tabType: params.tabType,
      viewState: params.viewState,
      name: content.name,
    });

    await this.persistSessionState(session);
    return this.restorer.restore(session).toClientDTO();
  }

  /**
   * 关闭标签
   */
  async closeTab(sessionId: string, tabId: string): Promise<EditorSessionClientDTO> {
    const session = await this.loadSessionWithGroups(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }

    session.closeTab(tabId);
    await this.sessionRepository.save(session);

    return this.restorer.restore(session).toClientDTO();
  }

  /**
   * 设置活动标签
   */
  async setActiveTab(sessionId: string, tabId: string): Promise<EditorSessionClientDTO> {
    const session = await this.loadSessionWithGroups(sessionId);
    if (!session) {
      throw new Error(`会话不存在: ${sessionId}`);
    }

    session.setActiveTab(tabId);
    await this.sessionRepository.save(session);

    return this.restorer.restore(session).toClientDTO();
  }

  /**
   * 保存文档内容
   */
  async saveContent(resourceId: string, content: string): Promise<void> {
    await this.repositoryContentPort.saveContent({ resourceId, content });
  }

  private countOpenTabs(session: EditorSession): number {
    return session.groups.reduce((count, group) => count + group.tabs.length, 0);
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
