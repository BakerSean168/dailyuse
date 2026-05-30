/**
 * EditorGroup 实体实现
 * 作为 EditorSession 实体的子实体
 */

import type {
  EditorGroupClientDTO,
  EditorGroupServerDTO,
  TabType,
  TabViewStateDTO,
} from '@dailyuse/contracts/editor';
import type {
  EditorGroupId,
  EditorSessionId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
} from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils/domain';
import { EditorGroupId as EditorGroupIdType } from '../../domain-shared/value-objects/editor-group-id';
import { EditorTab } from './editor-tab';
import { BusinessRuleViolationError } from '@dailyuse/utils/errors';

/**
 * EditorGroup 状态接口（domain types）
 */
export interface EditorGroupState {
  id: EditorGroupId;
  sessionId: EditorSessionId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  groupIndex: number;
  activeTabIndex: number;
  name: string | null;
  tabs: EditorTab[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * EditorGroup 实体
 * 作为 EditorSession 实体的子实体
 */
export class EditorGroup extends Entity<EditorGroupId> {
  // ===== 私有属性 =====
  private _props: Omit<EditorGroupState, 'id' | 'tabs'>;

  // ===== 子实体 =====
  private _tabs: EditorTab[];

  // ===== 构造函数（私有） =====
  private constructor(state: EditorGroupState) {
    super(state.id);
    const { id: _id, tabs, ...rest } = state;
    this._props = rest;
    this._tabs = tabs;
  }

  // ===== Getter 属性 =====
  public get sessionId(): EditorSessionId {
    return this._props.sessionId;
  }

  public get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get groupIndex(): number {
    return this._props.groupIndex;
  }

  public get activeTabIndex(): number {
    return this._props.activeTabIndex;
  }

  public get name(): string | null {
    return this._props.name;
  }

  public get tabs(): EditorTab[] {
    return [...this._tabs];
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 从状态恢复实体
   */
  public static load(state: EditorGroupState): EditorGroup {
    return new EditorGroup(state);
  }

  public static create(params: {
    sessionId: EditorSessionId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    groupIndex: number;
    name?: string;
  }): EditorGroup {
    const now = new Date();
    return new EditorGroup({
      id: EditorGroupIdType.of(EditorGroupIdType.generate()),
      sessionId: params.sessionId,
      workspaceId: params.workspaceId,
      identityId: params.identityId,
      groupIndex: params.groupIndex,
      activeTabIndex: -1,
      name: params.name ?? null,
      createdAt: now,
      updatedAt: now,
      tabs: [],
    });
  }

  // ===== 业务方法 =====
  public addTab(params: {
    resourceId?: string | null;
    type?: TabType;
    viewState?: Partial<TabViewStateDTO>;
    name?: string;
    isPinned?: boolean;
  }): EditorTab {
    const tab = EditorTab.create({
      groupId: this.id,
      sessionId: this._props.sessionId,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      resourceId: params.resourceId,
      type: params.type,
      viewState: params.viewState,
      name: params.name,
      isPinned: params.isPinned,
      tabIndex: this._tabs.length,
    });

    this._tabs.push(tab);
    this.setActiveTab(this._tabs.length - 1);
    this.updateTimestamp();

    return tab;
  }

  public removeTab(tabId: string): void {
    const index = this._tabs.findIndex((t) => t.id === tabId);
    if (index !== -1) {
      this._tabs.splice(index, 1);

      this.normalizeActiveTabIndex();

      this.updateTimestamp();
    }
  }

  public setActiveTab(tabIndex: number): void {
    if (tabIndex < 0 || tabIndex >= this._tabs.length) {
      throw new BusinessRuleViolationError('Active tab index must reference an open tab');
    }

    for (const [index, tab] of this._tabs.entries()) {
      if (index === tabIndex) {
        tab.activate();
      } else if (tab.isActive) {
        tab.deactivate();
      }
    }

    this._props.activeTabIndex = tabIndex;
    this.updateTimestamp();
  }

  public setActiveTabById(tabId: string): void {
    const index = this._tabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) {
      throw new BusinessRuleViolationError('Active tab must exist in open tabs');
    }
    this.setActiveTab(index);
  }

  public ensureActiveTabInvariant(): void {
    this.normalizeActiveTabIndex();
  }

  public restoreTabs(tabs: EditorTab[]): void {
    this._tabs = tabs;
    this.normalizeActiveTabIndex();
    this.updateTimestamp();
  }

  public rename(name: string | null): void {
    this._props.name = name;
    this.updateTimestamp();
  }

  public updateGroupIndex(groupIndex: number): void {
    this._props.groupIndex = groupIndex;
    this.updateTimestamp();
  }

  public getTab(tabId: string): EditorTab | undefined {
    return this._tabs.find((t) => t.id === tabId);
  }

  public getActiveTab(): EditorTab | undefined {
    return this._tabs[this._props.activeTabIndex];
  }

  private updateTimestamp(): void {
    this._props.updatedAt = new Date();
  }

  // ===== 计算属性 =====
  public get tabCount(): number {
    return this._tabs.length;
  }

  public get isEmpty(): boolean {
    return this._tabs.length === 0;
  }

  public get hasActiveTab(): boolean {
    return this._props.activeTabIndex >= 0 && this._props.activeTabIndex < this._tabs.length;
  }

  private normalizeActiveTabIndex(): void {
    if (this._tabs.length === 0) {
      this._props.activeTabIndex = -1;
      return;
    }

    const persistedActiveIndex = this._tabs.findIndex((tab) => tab.isActive);
    if (persistedActiveIndex >= 0) {
      this._props.activeTabIndex = persistedActiveIndex;
      for (const [index, tab] of this._tabs.entries()) {
        if (index !== persistedActiveIndex && tab.isActive) {
          tab.deactivate();
        }
      }
      return;
    }

    if (this._props.activeTabIndex < 0 || this._props.activeTabIndex >= this._tabs.length) {
      this._props.activeTabIndex = this._tabs.length - 1;
    }

    for (const [index, tab] of this._tabs.entries()) {
      if (index === this._props.activeTabIndex) {
        tab.activate();
      } else if (tab.isActive) {
        tab.deactivate();
      }
    }
  }

  // ===== 序列化方法 =====
  public toServerDTO(): EditorGroupServerDTO {
    return {
      id: this.id,
      sessionId: this._props.sessionId,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      groupIndex: this._props.groupIndex,
      activeTabIndex: this._props.activeTabIndex,
      name: this._props.name,
      tabs: this._tabs.map((tab) => tab.toServerDTO()),
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
    };
  }

  public toClientDTO(): EditorGroupClientDTO {
    return {
      id: this.id,
      sessionId: this._props.sessionId,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      groupIndex: this._props.groupIndex,
      activeTabIndex: this._props.activeTabIndex,
      name: this._props.name,
      tabs: this._tabs.map((tab) => tab.toClientDTO()),
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
      // UI 格式化字段
      formattedCreatedAt: this._props.createdAt.toLocaleString(),
      formattedUpdatedAt: this._props.updatedAt.toLocaleString(),
    };
  }
}
