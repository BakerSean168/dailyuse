/**
 * EditorTab 实体实现
 * 实现 EditorTabServer 接口
 */

import { Entity, generateUUID } from '@dailyuse/utils';
import { TabType } from '@dailyuse/contracts/editor';
import type {
  EditorTabClientDTO,
  EditorTabPersistenceDTO,
  EditorTabServer,
  EditorTabServerDTO,
  TabViewStateServerDTO,
} from '@dailyuse/contracts/editor';
import type {
  DocumentId,
  EditorGroupId,
  EditorSessionId,
  EditorTabId,
  EditorWorkspaceId,
  IdentityId,
} from '@dailyuse/contracts/primitives';

/**
 * EditorTab 实体
 */
export class EditorTab extends Entity<EditorTabId> implements EditorTabServer {
  // ===== 私有字段 =====
  private _groupId: EditorGroupId;
  private _sessionId: EditorSessionId;
  private _workspaceId: EditorWorkspaceId;
  private _identityId: IdentityId;
  private _documentId: DocumentId | null;
  private _tabIndex: number;
  private _tabType: TabType;
  private _name: string;
  private _viewState: TabViewStateServerDTO;
  private _isPinned: boolean;
  private _isDirty: boolean;
  private _lastAccessedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    id: EditorTabId;
    groupId: EditorGroupId;
    sessionId: EditorSessionId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    documentId: DocumentId | null;
    tabIndex: number;
    tabType: TabType;
    name: string;
    viewState: TabViewStateServerDTO;
    isPinned: boolean;
    isDirty: boolean;
    lastAccessedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._groupId = params.groupId;
    this._sessionId = params.sessionId;
    this._workspaceId = params.workspaceId;
    this._identityId = params.identityId;
    this._documentId = params.documentId;
    this._tabIndex = params.tabIndex;
    this._tabType = params.tabType;
    this._name = params.name;
    this._viewState = params.viewState;
    this._isPinned = params.isPinned;
    this._isDirty = params.isDirty;
    this._lastAccessedAt = params.lastAccessedAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public get groupId(): EditorGroupId {
    return this._groupId;
  }

  public get sessionId(): EditorSessionId {
    return this._sessionId;
  }

  public get workspaceId(): EditorWorkspaceId {
    return this._workspaceId;
  }

  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get documentId(): DocumentId | null {
    return this._documentId;
  }

  public get tabIndex(): number {
    return this._tabIndex;
  }

  public get tabType(): TabType {
    return this._tabType;
  }

  public get name(): string {
    return this._name;
  }

  public get viewState(): TabViewStateServerDTO {
    return this._viewState;
  }

  public get isPinned(): boolean {
    return this._isPinned;
  }

  public get isDirty(): boolean {
    return this._isDirty;
  }

  public get lastAccessedAt(): Date | null {
    return this._lastAccessedAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的标签
   */
  public static create(params: {
    groupId: EditorGroupId;
    sessionId: EditorSessionId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    documentId?: string | null;
    tabIndex: number;
    type?: TabType;
    name?: string;
    viewState?: Partial<TabViewStateServerDTO>;
    isPinned?: boolean;
  }): EditorTab {
    const id = generateUUID() as EditorTabId;
    const now = new Date();

    const defaultViewState: TabViewStateServerDTO = {
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
      documentId: (params.documentId ?? null) as DocumentId | null,
      tabIndex: params.tabIndex,
      tabType: params.type ?? TabType.Document,
      name: params.name ?? 'Untitled',
      viewState: defaultViewState,
      isPinned: params.isPinned ?? false,
      isDirty: false,
      lastAccessedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: EditorTabServerDTO): EditorTab {
    return new EditorTab({
      id: dto.id,
      groupId: dto.groupId,
      sessionId: dto.sessionId,
      workspaceId: dto.workspaceId,
      identityId: dto.identityId,
      documentId: dto.documentId,
      tabIndex: dto.tabIndex,
      tabType: dto.tabType,
      name: dto.name,
      viewState: dto.viewState,
      isPinned: dto.isPinned,
      isDirty: dto.isDirty,
      lastAccessedAt: dto.lastAccessedAt !== null ? new Date(dto.lastAccessedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 ClientDTO 恢复
   */
  public static fromClientDTO(dto: EditorTabClientDTO): EditorTab {
    return new EditorTab({
      id: dto.id as EditorTabId,
      groupId: dto.groupId as EditorGroupId,
      sessionId: dto.sessionId as EditorSessionId,
      workspaceId: dto.workspaceId as EditorWorkspaceId,
      identityId: dto.identityId as IdentityId,
      documentId: dto.documentId as DocumentId | null,
      tabIndex: dto.tabIndex,
      tabType: dto.tabType,
      name: dto.name,
      viewState: dto.viewState,
      isPinned: dto.isPinned,
      isDirty: dto.isDirty,
      lastAccessedAt: dto.lastAccessedAt !== null ? new Date(dto.lastAccessedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: EditorTabPersistenceDTO): EditorTab {
    return new EditorTab({
      id: dto.id,
      groupId: dto.group_id,
      sessionId: dto.session_id,
      workspaceId: dto.workspace_id,
      identityId: dto.identityId,
      documentId: dto.document_id,
      tabIndex: dto.tab_index,
      tabType: dto.tab_type,
      name: dto.name,
      viewState: JSON.parse(dto.view_state) as TabViewStateServerDTO,
      isPinned: dto.is_pinned,
      isDirty: dto.is_dirty,
      lastAccessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新标题
   */
  public updateName(name: string): void {
    this._name = name;
    this.updateTimestamp();
  }

  /**
   * 更新视图状态
   */
  public updateViewState(viewState: Partial<TabViewStateServerDTO>): void {
    this._viewState = { ...this._viewState, ...viewState };
    this.updateTimestamp();
  }

  /**
   * 切换固定状态
   */
  public togglePinned(): void {
    this._isPinned = !this._isPinned;
    this.updateTimestamp();
  }

  /**
   * 标记为脏（有未保存更改）
   */
  public markDirty(): void {
    this._isDirty = true;
    this.updateTimestamp();
  }

  /**
   * 标记为干净（已保存）
   */
  public markClean(): void {
    this._isDirty = false;
    this.updateTimestamp();
  }

  /**
   * 记录访问时间
   */
  public recordAccess(): void {
    this._lastAccessedAt = new Date();
    this.updateTimestamp();
  }

  /**
   * 更新标签索引（用于重新排序）
   */
  public updateTabIndex(tabIndex: number): void {
    this._tabIndex = tabIndex;
    this.updateTimestamp();
  }

  /**
   * 判断是否为文档标签
   */
  public isDocumentTab(): boolean {
    return this._tabType === TabType.Document;
  }

  private updateTimestamp(): void {
    this._updatedAt = new Date();
  }

  // ===== 序列化方法 =====

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): EditorTabServerDTO {
    return {
      id: this.id,
      groupId: this._groupId,
      sessionId: this._sessionId,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      documentId: this._documentId,
      tabIndex: this._tabIndex,
      tabType: this._tabType,
      name: this._name,
      viewState: this._viewState,
      isPinned: this._isPinned,
      isDirty: this._isDirty,
      lastAccessedAt: this._lastAccessedAt?.getTime() ?? null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为 ClientDTO
   */
  public toClientDTO(): EditorTabClientDTO {
    return {
      id: this.id as unknown as string,
      groupId: this._groupId as unknown as string,
      sessionId: this._sessionId as unknown as string,
      workspaceId: this._workspaceId as unknown as string,
      identityId: this._identityId as unknown as string,
      documentId: this._documentId as unknown as string | null,
      tabIndex: this._tabIndex,
      tabType: this._tabType,
      name: this._name,
      viewState: this._viewState,
      isPinned: this._isPinned,
      isDirty: this._isDirty,
      lastAccessedAt: this._lastAccessedAt?.getTime() ?? null,
      formattedLastAccessed: this._lastAccessedAt?.toLocaleString() ?? null,
      formattedCreatedAt: this._createdAt.toLocaleString(),
      formattedUpdatedAt: this._updatedAt.toLocaleString(),
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): EditorTabPersistenceDTO {
    return {
      id: this.id,
      group_id: this._groupId,
      session_id: this._sessionId,
      workspace_id: this._workspaceId,
      identityId: this._identityId,
      document_id: this._documentId,
      tab_index: this._tabIndex,
      tab_type: this._tabType,
      name: this._name,
      view_state: JSON.stringify(this._viewState),
      is_pinned: this._isPinned,
      is_dirty: this._isDirty,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
