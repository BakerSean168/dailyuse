/**
 * EditorSession - 编辑器会话实体
 *
 * ⚠️ 注意：这是一个实体，不是聚合根
 *
 * 所属聚合根: EditorWorkspace
 * 包含子实体: EditorGroup[]
 *
 * DDD 层次:
 * EditorWorkspace (聚合根)
 *   └── EditorSession (实体)
 *       └── EditorGroup (实体)
 *           └── EditorTab (实体)
 */

import { Entity } from '@dailyuse/utils/domain';
import type {
  EditorSessionClientDTO,
  EditorSessionServerDTO,
  SessionLayoutDTO,
  TabViewStateDTO,
} from '@dailyuse/contracts/editor';
import { TabType } from '@dailyuse/contracts/editor';
import type {
  EditorSessionId,
  EditorWorkspaceId,
  IdentityId,
} from '@dailyuse/contracts/primitives';
import { EditorSessionId as EditorSessionIdType } from '../value-objects/editor-session-id';
import { SessionLayout } from '../value-objects/session-layout';
import { EditorGroup } from './editor-group';
import { EditorTab } from './editor-tab';
import { BusinessRuleViolationError } from '@dailyuse/utils/errors';

/**
 * EditorSession 状态接口（domain types）
 */
export interface EditorSessionState {
  id: EditorSessionId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  layout: SessionLayout;
  isActive: boolean;
  activeGroupIndex: number;
  groups: EditorGroup[];
  lastAccessedAt: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export class EditorSession extends Entity<EditorSessionId> {
  // ===== 私有属性 =====
  private _props: Omit<EditorSessionState, 'id' | 'groups'>;

  // ===== 子实体集合 =====
  private _groups: EditorGroup[] = [];

  private constructor(state: EditorSessionState) {
    super(state.id);
    const { id: _id, groups, ...rest } = state;
    this._props = rest;
    this._groups = groups;
  }

  // ===== Getter 属性 =====

  public get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get name(): string {
    return this._props.name;
  }

  public get description(): string | null {
    return this._props.description;
  }

  public get groups(): EditorGroup[] {
    return [...this._groups]; // 返回副本
  }

  public get isActive(): boolean {
    return this._props.isActive;
  }

  public get activeGroupIndex(): number {
    return this._props.activeGroupIndex;
  }

  public get layout(): SessionLayout {
    return this._props.layout;
  }

  public get lastAccessedAt(): number | null {
    return this._props.lastAccessedAt;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ===== 实例属性修改方法 =====

  /**
   * 重命名会话
   */
  public rename(newName: string): void {
    if (!newName || newName.trim() === '') {
      throw new Error('会话名称不能为空');
    }
    this._props.name = newName.trim();
    this._props.updatedAt = new Date();
  }

  /**
   * 更新描述
   * @param newDescription 新描述，可以为 null 清除描述
   */
  public updateDescription(newDescription: string | null): void {
    this._props.description = newDescription ? newDescription.trim() : null;
    this._props.updatedAt = new Date();
  }

  // ===== 工厂方法 =====

  /**
   * 从状态恢复实体
   */
  public static load(state: EditorSessionState): EditorSession {
    return new EditorSession(state);
  }

  /**
   * 创建新的 EditorSession
   */
  public static create(params: {
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    name: string;
    description?: string;
    layout?: Partial<SessionLayoutDTO>;
    createDefaultGroup?: boolean;
  }): EditorSession {
    const id = EditorSessionIdType.of(EditorSessionIdType.generate());
    const now = new Date();

    const layout = params.layout
      ? SessionLayout.fromDTO({
          ...SessionLayout.createDefault().toDTO(),
          ...params.layout,
        })
      : SessionLayout.createDefault();

    const session = new EditorSession({
      id,
      workspaceId: params.workspaceId,
      identityId: params.identityId,
      name: params.name,
      description: params.description ?? null,
      layout,
      isActive: false,
      activeGroupIndex: 0,
      groups: [],
      lastAccessedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    if (params.createDefaultGroup !== false) {
      session.addGroup({ groupIndex: 0, name: 'Main' });
      session.setActiveGroup(0);
    }

    return session;
  }

  // ===== 子实体管理方法 =====

  /**
   * 添加分组
   */
  public addGroup(params: { groupIndex: number; name?: string }): EditorGroup {
    const group = EditorGroup.create({
      sessionId: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      groupIndex: params.groupIndex,
      name: params.name,
    });

    this._groups.push(group);
    this.updateTimestamp();

    return group;
  }

  /**
   * 移除分组
   */
  public removeGroup(groupId: string): void {
    const index = this._groups.findIndex((g) => g.id === groupId);
    if (index !== -1) {
      this._groups.splice(index, 1);

      // 调整活动分组索引
      if (this._props.activeGroupIndex >= this._groups.length) {
        this._props.activeGroupIndex = Math.max(0, this._groups.length - 1);
      }

      this.updateTimestamp();
    }
  }

  /**
   * 获取指定分组
   */
  public getGroup(groupId: string): EditorGroup | undefined {
    return this._groups.find((g) => g.id === groupId);
  }

  /**
   * 获取所有分组
   */
  public getAllGroups(): EditorGroup[] {
    return [...this._groups];
  }

  /**
   * 设置活动分组
   */
  public setActiveGroup(groupIndex: number): void {
    if (groupIndex >= 0 && groupIndex < this._groups.length) {
      this._props.activeGroupIndex = groupIndex;
      this.updateTimestamp();
    }
  }

  public openTab(
    resourceId: string,
    params?: {
      groupId?: string;
      tabType?: TabType;
      name?: string;
      viewState?: Partial<TabViewStateDTO>;
      isPinned?: boolean;
    },
  ): EditorTab {
    const group = this.resolveTargetGroup(params?.groupId);
    const existing = group.tabs.find((tab) => tab.resourceId === resourceId);
    if (existing) {
      group.setActiveTabById(existing.id);
      this._props.activeGroupIndex = this._groups.indexOf(group);
      this.updateTimestamp();
      return existing;
    }

    const tab = group.addTab({
      resourceId,
      type: params?.tabType,
      viewState: params?.viewState,
      name: params?.name,
      isPinned: params?.isPinned,
    });

    this._props.activeGroupIndex = this._groups.indexOf(group);
    this.updateTimestamp();

    return tab;
  }

  public closeTab(tabId: string): void {
    const groupIndex = this._groups.findIndex((group) => group.getTab(tabId));
    if (groupIndex < 0) {
      return;
    }

    const group = this._groups[groupIndex];
    group.removeTab(tabId);

    if (!group.hasActiveTab && this._groups.some((g) => g.hasActiveTab)) {
      const nextIndex = this._groups.findIndex((g) => g.hasActiveTab);
      if (nextIndex >= 0) {
        this._props.activeGroupIndex = nextIndex;
      }
    } else if (this._props.activeGroupIndex >= this._groups.length) {
      this._props.activeGroupIndex = Math.max(0, this._groups.length - 1);
    }

    this.normalizeActiveState();
    this.updateTimestamp();
  }

  public setActiveTab(tabId: string): void {
    const groupIndex = this._groups.findIndex((group) => group.getTab(tabId));
    if (groupIndex < 0) {
      throw new BusinessRuleViolationError('Active tab must exist in the current session');
    }

    const group = this._groups[groupIndex];
    group.setActiveTabById(tabId);
    this._props.activeGroupIndex = groupIndex;
    this.updateTimestamp();
  }

  // ===== 业务方法 =====

  /**
   * 激活会话
   */
  public activate(): void {
    this._props.isActive = true;
    this._props.lastAccessedAt = Date.now();
    this._props.updatedAt = new Date();
  }

  /**
   * 取消激活
   */
  public deactivate(): void {
    this._props.isActive = false;
    this._props.updatedAt = new Date();
  }

  /**
   * 更新布局配置
   */
  public updateLayout(layout: Partial<SessionLayoutDTO>): void {
    this._props.layout = this._props.layout.with(layout);
    this.updateTimestamp();
  }

  /**
   * 更新会话基本信息
   */
  public update(updates: { name?: string; description?: string | null }): void {
    if (updates.name) {
      this._props.name = updates.name;
    }
    if (updates.description !== undefined) {
      this._props.description = updates.description;
    }
    this.updateTimestamp();
  }

  /**
   * 更新最后访问时间
   */
  public updateLastAccessedAt(): void {
    this._props.lastAccessedAt = Date.now();
    this.updateTimestamp();
  }

  /**
   * 更新时间戳
   */
  private updateTimestamp(): void {
    this._props.updatedAt = new Date();
  }

  private resolveTargetGroup(groupId?: string): EditorGroup {
    if (groupId) {
      const target = this._groups.find((group) => group.id === groupId);
      if (!target) {
        throw new Error(`Group not found: ${groupId}`);
      }
      return target;
    }

    if (this._groups.length === 0) {
      return this.addGroup({ groupIndex: 0, name: 'Main' });
    }

    return this._groups[this._props.activeGroupIndex] ?? this._groups[0];
  }

  public normalizeActiveState(): void {
    if (this._groups.length === 0) {
      this._props.activeGroupIndex = 0;
      return;
    }

    if (this._props.activeGroupIndex < 0 || this._props.activeGroupIndex >= this._groups.length) {
      this._props.activeGroupIndex = 0;
    }

    for (const group of this._groups) {
      group.ensureActiveTabInvariant();
    }
  }

  public restoreGroups(groups: EditorGroup[]): void {
    this._groups = groups;
    this.normalizeActiveState();
    this.updateTimestamp();
  }

  // ===== DTO 转换方法 =====

  /**
   * 转换为 Server DTO (递归转换子实体)
   */
  public toServerDTO(): EditorSessionServerDTO {
    return {
      id: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      groups: this._groups.map((group) => group.toServerDTO()),
      isActive: this._props.isActive,
      activeGroupIndex: this._props.activeGroupIndex,
      layout: this._props.layout.toDTO(),
      lastAccessedAt: this._props.lastAccessedAt,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }

  /**
   * 转换为 Client DTO (递归转换子实体)
   */
  public toClientDTO(): EditorSessionClientDTO {
    return {
      id: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      groups: this._groups.map((group) => group.toClientDTO()),
      isActive: this._props.isActive,
      activeGroupIndex: this._props.activeGroupIndex,
      layout: this._props.layout.toDTO(),
      groupCount: this._groups.length,
      lastAccessedAt: this._props.lastAccessedAt,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }
}
