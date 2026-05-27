/**
 * EditorTab 实体实现
 */

import { Entity } from '@dailyuse/utils/domain';
import { generateUUID } from '@dailyuse/utils/shared';
import { TabType } from '@dailyuse/contracts/editor';
import type {
  EditorTabClientDTO,
  EditorTabServerDTO,
  TabViewStateDTO,
} from '@dailyuse/contracts/editor';
import type {
  EditorGroupId,
  EditorSessionId,
  EditorTabId,
  EditorWorkspaceId,
  IdentityId,
  ResourceId,
} from '@dailyuse/contracts/primitives';

/**
 * EditorTab 状态接口（domain types）
 */
export interface EditorTabState {
  id: EditorTabId;
  groupId: EditorGroupId;
  sessionId: EditorSessionId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  resourceId: string | null;
  tabIndex: number;
  tabType: TabType;
  name: string;
  viewState: TabViewStateDTO;
  isPinned: boolean;
  isActive: boolean;
  isDirty: boolean;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * EditorTab 实体
 */
export class EditorTab extends Entity<EditorTabId> {
  // ===== 私有属性 =====
  private _props: EditorTabState;

  // ===== 构造函数（私有） =====
  private constructor(state: EditorTabState) {
    super(state.id);
    this._props = { ...state };
  }

  // ===== Getter 属性 =====
  public get groupId(): EditorGroupId {
    return this._props.groupId;
  }

  public get sessionId(): EditorSessionId {
    return this._props.sessionId;
  }

  public get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get resourceId(): string | null {
    return this._props.resourceId;
  }

  public get tabIndex(): number {
    return this._props.tabIndex;
  }

  public get tabType(): TabType {
    return this._props.tabType;
  }

  public get name(): string {
    return this._props.name;
  }

  public get viewState(): TabViewStateDTO {
    return this._props.viewState;
  }

  public get isPinned(): boolean {
    return this._props.isPinned;
  }

  public get isActive(): boolean {
    return this._props.isActive;
  }

  public get isDirty(): boolean {
    return this._props.isDirty;
  }

  public get lastAccessedAt(): Date | null {
    return this._props.lastAccessedAt;
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
  public static load(state: EditorTabState): EditorTab {
    return new EditorTab(state);
  }

  /**
   * 创建新的标签
   */
  public static create(params: {
    groupId: EditorGroupId;
    sessionId: EditorSessionId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    resourceId?: string | null;
    tabIndex: number;
    type?: TabType;
    name?: string;
    viewState?: Partial<TabViewStateDTO>;
    isPinned?: boolean;
  }): EditorTab {
    const id = generateUUID() as EditorTabId;
    const now = new Date();

    const defaultViewState: TabViewStateDTO = {
      scrollTop: 0,
      scrollLeft: 0,
      cursorPosition: { line: 0, column: 0 },
      selections: [],
      ...params.viewState,
    };

    return new EditorTab({
      id,
      groupId: params.groupId,
      sessionId: params.sessionId,
      workspaceId: params.workspaceId,
      identityId: params.identityId,
      resourceId: params.resourceId ?? null,
      tabIndex: params.tabIndex,
      tabType: params.type ?? TabType.Resource,
      name: params.name ?? 'Untitled',
      viewState: defaultViewState,
      isPinned: params.isPinned ?? false,
      isActive: false,
      isDirty: false,
      lastAccessedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新标题
   */
  public updateName(name: string): void {
    this._props.name = name;
    this.updateTimestamp();
  }

  /**
   * 更新视图状态
   */
  public updateViewState(viewState: Partial<TabViewStateDTO>): void {
    this._props.viewState = { ...this._props.viewState, ...viewState };
    this.updateTimestamp();
  }

  /**
   * 切换固定状态
   */
  public togglePinned(): void {
    this._props.isPinned = !this._props.isPinned;
    this.updateTimestamp();
  }

  public activate(): void {
    this._props.isActive = true;
    this.recordAccess();
  }

  public deactivate(): void {
    this._props.isActive = false;
    this.updateTimestamp();
  }

  /**
   * 标记为脏（有未保存更改）
   */
  public markDirty(): void {
    this._props.isDirty = true;
    this.updateTimestamp();
  }

  /**
   * 标记为干净（已保存）
   */
  public markClean(): void {
    this._props.isDirty = false;
    this.updateTimestamp();
  }

  /**
   * 记录访问时间
   */
  public recordAccess(): void {
    this._props.lastAccessedAt = new Date();
    this.updateTimestamp();
  }

  /**
   * 更新标签索引（用于重新排序）
   */
  public updateTabIndex(tabIndex: number): void {
    this._props.tabIndex = tabIndex;
    this.updateTimestamp();
  }

  /**
   * 判断是否为资源标签
   */
  public isResourceTab(): boolean {
    return this._props.tabType === TabType.Resource;
  }

  private updateTimestamp(): void {
    this._props.updatedAt = new Date();
  }

  // ===== 序列化方法 =====

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): EditorTabServerDTO {
    return {
      id: this.id,
      groupId: this._props.groupId,
      sessionId: this._props.sessionId,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      resourceId: this._props.resourceId as ResourceId | null,
      tabIndex: this._props.tabIndex,
      tabType: this._props.tabType,
      name: this._props.name,
      viewState: this._props.viewState,
      isPinned: this._props.isPinned,
      isActive: this._props.isActive,
      isDirty: this._props.isDirty,
      lastAccessedAt: this._props.lastAccessedAt?.getTime() ?? null,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }

  /**
   * 转换为 ClientDTO
   */
  public toClientDTO(): EditorTabClientDTO {
    return {
      id: this.id,
      groupId: this._props.groupId,
      sessionId: this._props.sessionId,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      resourceId: this._props.resourceId as ResourceId | null,
      tabIndex: this._props.tabIndex,
      tabType: this._props.tabType,
      name: this._props.name,
      viewState: this._props.viewState,
      isPinned: this._props.isPinned,
      isActive: this._props.isActive,
      isDirty: this._props.isDirty,
      lastAccessedAt: this._props.lastAccessedAt?.getTime() ?? null,
      formattedLastAccessed: this._props.lastAccessedAt?.toLocaleString() ?? null,
      formattedCreatedAt: this._props.createdAt.toLocaleString(),
      formattedUpdatedAt: this._props.updatedAt.toLocaleString(),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }
}
