/**
 * EditorTab 实体实现
 * 实现 EditorTabServer 接口
 * 作为 EditorGroup 实体的子实体
 */

import type {
  EditorTabClientDTO,
  EditorTabPersistenceDTO,
  EditorTabServer,
  EditorTabServerDTO,
  TabType,
  TabViewStateServerDTO,
} from '@dailyuse/contracts/editor';
import { Entity } from '@dailyuse/utils';
import { TabViewState } from '../value-objects/TabViewState';

/**
 * EditorTab 实体
 * 作为 EditorGroup 实体的子实体
 */
export class EditorTab extends Entity implements EditorTabServer {
  // ===== 私有字段 =====
  private _groupUuid: string; // 父实体外键
  private _sessionUuid: string;
  private _workspaceUuid: string; // 聚合根外键
  private _accountUuid: string;
  private _documentUuid: string | null;
  private _tabIndex: number;
  private _tabType: TabType;
  private _name: string;
  private _viewState: TabViewState;
  private _isPinned: boolean;
  private _isDirty: boolean;
  private _lastAccessedAt: number | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    groupUuid: string;
    sessionUuid: string;
    workspaceUuid: string;
    accountUuid: string;
    documentUuid?: string | null;
    tabIndex: number;
    tabType: TabType;
    name: string;
    viewState: TabViewState;
    isPinned: boolean;
    isDirty: boolean;
    lastAccessedAt?: number | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._groupUuid = params.groupUuid;
    this._sessionUuid = params.sessionUuid;
    this._workspaceUuid = params.workspaceUuid;
    this._accountUuid = params.accountUuid;
    this._documentUuid = params.documentUuid ?? null;
    this._tabIndex = params.tabIndex;
    this._tabType = params.tabType;
    this._name = params.name;
    this._viewState = params.viewState;
    this._isPinned = params.isPinned;
    this._isDirty = params.isDirty;
    this._lastAccessedAt = params.lastAccessedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get groupUuid(): string {
    return this._groupUuid;
  }
  public get sessionUuid(): string {
    return this._sessionUuid;
  }
  public get workspaceUuid(): string {
    return this._workspaceUuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get documentUuid(): string | null {
    return this._documentUuid;
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
    return this._viewState.toServerDTO();
  }
  public get isPinned(): boolean {
    return this._isPinned;
  }
  public get isDirty(): boolean {
    return this._isDirty;
  }
  public get lastAccessedAt(): number | null {
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
   * 创建新的 EditorTab
   */
  public static create(params: {
    groupUuid: string;
    sessionUuid: string;
    workspaceUuid: string;
    accountUuid: string;
    documentUuid?: string | null;
    tabIndex: number;
    tabType: TabType;
    name: string;
    viewState?: Partial<TabViewStateServerDTO>;
    isPinned?: boolean;
  }): EditorTab {
    const uuid = crypto.randomUUID();
    const now = new Date();

    // 创建默认视图状态
    const viewState = params.viewState
      ? TabViewState.fromServerDTO({
          ...TabViewState.createDefault().toServerDTO(),
          ...params.viewState,
        })
      : TabViewState.createDefault();

    return new EditorTab({
      uuid,
      groupUuid: params.groupUuid,
      sessionUuid: params.sessionUuid,
      workspaceUuid: params.workspaceUuid,
      accountUuid: params.accountUuid,
      documentUuid: params.documentUuid,
      tabIndex: params.tabIndex,
      tabType: params.tabType,
      name: params.name,
      viewState,
      isPinned: params.isPinned ?? false,
      isDirty: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== From DTO 方法 =====

  /**
   * 从 Server DTO 重建
   */
  public static fromServerDTO(dto: EditorTabServerDTO): EditorTab {
    return new EditorTab({
      uuid: dto.uuid,
      groupUuid: dto.groupUuid,
      sessionUuid: dto.sessionUuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      documentUuid: dto.documentUuid,
      tabIndex: dto.tabIndex,
      tabType: dto.tabType,
      name: dto.name,
      viewState: TabViewState.fromServerDTO(dto.viewState),
      isPinned: dto.isPinned,
      isDirty: dto.isDirty,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 Client DTO 重建
   */
  public static fromClientDTO(dto: EditorTabClientDTO): EditorTab {
    return new EditorTab({
      uuid: dto.uuid,
      groupUuid: dto.groupUuid,
      sessionUuid: dto.sessionUuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      documentUuid: dto.documentUuid,
      tabIndex: dto.tabIndex,
      tabType: dto.tabType,
      name: dto.name,
      viewState: dto.viewState
        ? TabViewState.fromServerDTO(dto.viewState)
        : TabViewState.createDefault(),
      isPinned: dto.isPinned,
      isDirty: dto.isDirty,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 Persistence DTO 重建
   */
  public static fromPersistenceDTO(dto: EditorTabPersistenceDTO): EditorTab {
    return new EditorTab({
      uuid: dto.uuid,
      groupUuid: dto.groupUuid,
      sessionUuid: dto.session_uuid,
      workspaceUuid: dto.workspace_uuid,
      accountUuid: dto.accountUuid,
      documentUuid: dto.document_uuid,
      tabIndex: dto.tab_index,
      tabType: dto.tab_type,
      name: dto.name,
      viewState: TabViewState.fromPersistenceDTO(JSON.parse(dto.view_state)),
      isPinned: dto.is_pinned,
      isDirty: dto.is_dirty,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新名称
   */
  public updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  /**
   * 更新视图状态
   */
  public updateViewState(viewState: Partial<TabViewStateServerDTO>): void {
    this._viewState = this._viewState.with(viewState);
    this._updatedAt = new Date();
  }

  /**
   * 切换固定状态
   */
  public togglePin(): void {
    this._isPinned = !this._isPinned;
    this._updatedAt = new Date();
  }

  /**
   * 标记为脏（有未保存更改）
   */
  public markDirty(): void {
    this._isDirty = true;
    this._updatedAt = new Date();
  }

  /**
   * 标记为干净（已保存）
   */
  public markClean(): void {
    this._isDirty = false;
    this._updatedAt = new Date();
  }

  /**
   * 记录访问时间
   */
  public recordAccess(): void {
    this._lastAccessedAt = Date.now();
    this._updatedAt = new Date();
  }

  /**
   * 更新标签索引（用于重新排序）
   */
  public updateTabIndex(newIndex: number): void {
    this._tabIndex = newIndex;
    this._updatedAt = new Date();
  }

  /**
   * 判断是否为文档标签
   */
  public isDocumentTab(): boolean {
    return this._tabType === 'document' && this._documentUuid !== null;
  }

  // ===== DTO 转换方法 =====

  public toServerDTO(): EditorTabServerDTO {
    return {
      uuid: this._uuid,
      groupUuid: this._groupUuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      documentUuid: this._documentUuid,
      tabIndex: this._tabIndex,
      tabType: this._tabType,
      name: this._name,
      viewState: this._viewState.toServerDTO(),
      isPinned: this._isPinned,
      isDirty: this._isDirty,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toClientDTO(): EditorTabClientDTO {
    return {
      uuid: this._uuid,
      groupUuid: this._groupUuid,
      sessionUuid: this._sessionUuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      documentUuid: this._documentUuid,
      tabIndex: this._tabIndex,
      tabType: this._tabType,
      name: this._name,
      viewState: this._viewState.toClientDTO(),
      isPinned: this._isPinned,
      isDirty: this._isDirty,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      formattedLastAccessed: this._lastAccessedAt
        ? new Date(this._lastAccessedAt).toLocaleString()
        : null,
      formattedCreatedAt: this._createdAt.toLocaleString(),
      formattedUpdatedAt: this._updatedAt.toLocaleString(),
    };
  }

  public toPersistenceDTO(): EditorTabPersistenceDTO {
    return {
      uuid: this._uuid,
      groupUuid: this._groupUuid,
      session_uuid: this._sessionUuid,
      workspace_uuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      document_uuid: this._documentUuid,
      tab_index: this._tabIndex,
      tab_type: this._tabType,
      name: this._name,
      view_state: JSON.stringify(this._viewState.toPersistenceDTO()),
      is_pinned: this._isPinned,
      is_dirty: this._isDirty,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
