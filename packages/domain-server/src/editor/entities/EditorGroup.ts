/**
 * EditorGroup 实体实现
 * 实现 EditorGroupServer 接口
 * 作为 EditorSession 实体的子实体
 */

import type {
  EditorGroupClientDTO,
  EditorGroupPersistenceDTO,
  EditorGroupServer,
  EditorGroupServerDTO,
  TabType,
  TabViewStateServerDTO,
} from '@dailyuse/contracts/editor';
import type {
  EditorGroupId,
  EditorSessionId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
} from '@dailyuse/contracts/primitives';
import { Entity, generateUUID } from '@dailyuse/utils';
import { EditorTab } from './EditorTab';

/**
 * EditorGroup 实体
 * 作为 EditorSession 实体的子实体
 */
export class EditorGroup extends Entity<EditorGroupId> implements EditorGroupServer {
  // ===== 私有字段 =====
  private _sessionId: EditorSessionId;
  private _workspaceId: EditorWorkspaceId;
  private _identityId: IdentityId;
  private _groupIndex: number;
  private _activeTabIndex: number;
  private _name: string | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 子实体 =====
  private _tabs: EditorTab[];

  // ===== 构造函数（私有） =====
  private constructor(params: {
    id: EditorGroupId;
    sessionId: EditorSessionId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    groupIndex: number;
    activeTabIndex: number;
    name?: string | null;
    createdAt: Date;
    updatedAt: Date;
    tabs?: EditorTab[];
  }) {
    super(params.id);
    this._sessionId = params.sessionId;
    this._workspaceId = params.workspaceId;
    this._identityId = params.identityId;
    this._groupIndex = params.groupIndex;
    this._activeTabIndex = params.activeTabIndex;
    this._name = params.name ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._tabs = params.tabs ?? [];
  }

  // ===== Getter 属性 =====
  public get sessionId(): EditorSessionId {
    return this._sessionId;
  }

  public get workspaceId(): EditorWorkspaceId {
    return this._workspaceId;
  }

  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get groupIndex(): number {
    return this._groupIndex;
  }

  public get activeTabIndex(): number {
    return this._activeTabIndex;
  }

  public get name(): string | null {
    return this._name;
  }

  public get tabs(): EditorTab[] {
    return [...this._tabs];
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====
  public static create(params: {
    sessionId: EditorSessionId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    groupIndex: number;
    name?: string;
  }): EditorGroup {
    const now = new Date();
    return new EditorGroup({
      id: generateUUID() as EditorGroupId,
      sessionId: params.sessionId,
      workspaceId: params.workspaceId,
      identityId: params.identityId,
      groupIndex: params.groupIndex,
      activeTabIndex: 0,
      name: params.name ?? null,
      createdAt: now,
      updatedAt: now,
      tabs: [],
    });
  }

  public static fromServerDTO(dto: EditorGroupServerDTO): EditorGroup {
    const group = new EditorGroup({
      id: dto.id,
      sessionId: dto.sessionId,
      workspaceId: dto.workspaceId,
      identityId: dto.identityId,
      groupIndex: dto.groupIndex,
      activeTabIndex: dto.activeTabIndex,
      name: dto.name,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      tabs: [],
    });

    // 递归重建子实体
    group._tabs = dto.tabs?.map((tabDto) => EditorTab.fromServerDTO(tabDto)) ?? [];

    return group;
  }

  public static fromClientDTO(dto: EditorGroupClientDTO): EditorGroup {
    const group = new EditorGroup({
      id: dto.id as EditorGroupId,
      sessionId: dto.sessionId as EditorSessionId,
      workspaceId: dto.workspaceId as EditorWorkspaceId,
      identityId: dto.identityId as IdentityId,
      groupIndex: dto.groupIndex,
      activeTabIndex: dto.activeTabIndex,
      name: dto.name,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      tabs: [],
    });

    // 递归重建子实体
    group._tabs = dto.tabs?.map((tabDto) => EditorTab.fromClientDTO(tabDto)) ?? [];

    return group;
  }

  public static fromPersistenceDTO(dto: EditorGroupPersistenceDTO): EditorGroup {
    const group = new EditorGroup({
      id: dto.id,
      sessionId: dto.session_id,
      workspaceId: dto.workspace_id,
      identityId: dto.identityId,
      groupIndex: dto.group_index,
      activeTabIndex: dto.active_tab_index,
      name: dto.name,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      tabs: [],
    });

    // 递归重建子实体
    group._tabs = dto.tabs?.map((tabDto) => EditorTab.fromPersistenceDTO(tabDto)) ?? [];

    return group;
  }

  // ===== 业务方法 =====
  public addTab(params: {
    documentId?: string | null;
    type?: TabType;
    viewState?: Partial<TabViewStateServerDTO>;
  }): EditorTab {
    const tab = EditorTab.create({
      groupId: this.id,
      sessionId: this._sessionId,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      documentId: params.documentId,
      type: params.type,
      viewState: params.viewState,
      tabIndex: this._tabs.length,
    });

    this._tabs.push(tab);
    this._activeTabIndex = this._tabs.length - 1;
    this.updateTimestamp();

    return tab;
  }

  public removeTab(tabId: string): void {
    const index = this._tabs.findIndex((t) => t.id === tabId);
    if (index !== -1) {
      this._tabs.splice(index, 1);

      // 调整活动标签索引
      if (this._activeTabIndex >= this._tabs.length) {
        this._activeTabIndex = Math.max(0, this._tabs.length - 1);
      }

      this.updateTimestamp();
    }
  }

  public setActiveTab(tabIndex: number): void {
    if (tabIndex >= 0 && tabIndex < this._tabs.length) {
      this._activeTabIndex = tabIndex;
      this.updateTimestamp();
    }
  }

  public rename(name: string | null): void {
    this._name = name;
    this.updateTimestamp();
  }

  public updateGroupIndex(groupIndex: number): void {
    this._groupIndex = groupIndex;
    this.updateTimestamp();
  }

  public getTab(tabId: string): EditorTab | undefined {
    return this._tabs.find((t) => t.id === tabId);
  }

  public getActiveTab(): EditorTab | undefined {
    return this._tabs[this._activeTabIndex];
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // ===== 计算属性 =====
  public get tabCount(): number {
    return this._tabs.length;
  }

  public get isEmpty(): boolean {
    return this._tabs.length === 0;
  }

  public get hasActiveTab(): boolean {
    return this._activeTabIndex >= 0 && this._activeTabIndex < this._tabs.length;
  }

  // ===== 序列化方法 =====
  public toServerDTO(): EditorGroupServerDTO {
    return {
      id: this.id,
      sessionId: this._sessionId,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      groupIndex: this._groupIndex,
      activeTabIndex: this._activeTabIndex,
      name: this._name,
      tabs: this._tabs.map((tab) => tab.toServerDTO()),
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
    };
  }

  public toClientDTO(): EditorGroupClientDTO {
    return {
      id: this.id,
      sessionId: this._sessionId,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      groupIndex: this._groupIndex,
      activeTabIndex: this._activeTabIndex,
      name: this._name,
      tabs: this._tabs.map((tab) => tab.toClientDTO()),
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
      // UI 格式化字段
      formattedCreatedAt: this._createdAt.toLocaleString(),
      formattedUpdatedAt: this._updatedAt.toLocaleString(),
    };
  }

  public toPersistenceDTO(): EditorGroupPersistenceDTO {
    return {
      id: this.id,
      session_id: this._sessionId,
      workspace_id: this._workspaceId,
      identityId: this._identityId,
      group_index: this._groupIndex,
      active_tab_index: this._activeTabIndex,
      name: this._name,
      tabs: this._tabs.map((tab) => tab.toPersistenceDTO()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
