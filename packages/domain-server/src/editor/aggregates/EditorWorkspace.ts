/**
 * EditorWorkspace 聚合根实现
 * 实现 EditorWorkspaceServer 接口
 */

import {
  ProjectType,
} from '@dailyuse/contracts/editor';
import type {
  EditorWorkspaceClientDTO,
  EditorWorkspacePersistenceDTO,
  EditorWorkspaceServer,
  EditorWorkspaceServerDTO,
  SessionLayoutServerDTO,
  WorkspaceLayoutServerDTO,
  WorkspaceSettingsServerDTO,
} from '@dailyuse/contracts/editor';
import { AggregateRoot } from '@dailyuse/utils';
import { WorkspaceLayout } from '../value-objects/WorkspaceLayout';
import { WorkspaceSettings } from '../value-objects/WorkspaceSettings';
import { EditorSession } from '../entities/EditorSession';
import { EditorGroup } from '../entities/EditorGroup';
import { EditorTab } from '../entities/EditorTab';

/**
 * EditorWorkspace 聚合根
 *
 * DDD 聚合根职责：
 * - 管理编辑器工作区的生命周期
 * - 执行业务逻辑
 * - 确保聚合内的一致性
 * - 是事务边界
 */
export class EditorWorkspace extends AggregateRoot implements EditorWorkspaceServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _projectPath: string;
  private _projectType: ProjectType;
  private _layout: WorkspaceLayout;
  private _settings: WorkspaceSettings;
  private _isActive: boolean;
  private _lastActiveSessionUuid: string | null;
  private _lastAccessedAt: number | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 子实体 =====
  private _sessions: EditorSession[];

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    description?: string | null;
    projectPath: string;
    projectType: ProjectType;
    layout: WorkspaceLayout;
    settings: WorkspaceSettings;
    isActive: boolean;
    lastActiveSessionUuid?: string | null;
    lastAccessedAt?: number | null;
    createdAt: Date;
    updatedAt: Date;
    sessions?: EditorSession[];
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description ?? null;
    this._projectPath = params.projectPath;
    this._projectType = params.projectType;
    this._layout = params.layout;
    this._settings = params.settings;
    this._isActive = params.isActive;
    this._lastActiveSessionUuid = params.lastActiveSessionUuid ?? null;
    this._lastAccessedAt = params.lastAccessedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._sessions = params.sessions ?? [];
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get name(): string {
    return this._name;
  }
  public get description(): string | null {
    return this._description;
  }
  public get projectPath(): string {
    return this._projectPath;
  }
  public get projectType(): ProjectType {
    return this._projectType;
  }
  public get layout(): WorkspaceLayoutServerDTO {
    return this._layout.toServerDTO();
  }
  public get settings(): WorkspaceSettingsServerDTO {
    return this._settings.toServerDTO();
  }
  public get isActive(): boolean {
    return this._isActive;
  }
  public get lastActiveSessionUuid(): string | null {
    return this._lastActiveSessionUuid;
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
  public get sessions(): EditorSession[] {
    return [...this._sessions]; // 返回副本，防止外部修改
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 EditorWorkspace 聚合根
   */
  public static create(params: {
    accountUuid: string;
    name: string;
    description?: string;
    projectPath: string;
    projectType: ProjectType;
    layout?: Partial<WorkspaceLayoutServerDTO>;
    settings?: Partial<WorkspaceSettingsServerDTO>;
  }): EditorWorkspace {
    const uuid = crypto.randomUUID();
    const now = new Date();

    // 创建默认布局和设置
    const layout = params.layout
      ? WorkspaceLayout.fromServerDTO({
          ...WorkspaceLayout.createDefault().toServerDTO(),
          ...params.layout,
        })
      : WorkspaceLayout.createDefault();

    const settings = params.settings
      ? WorkspaceSettings.fromServerDTO({
          ...WorkspaceSettings.createDefault().toServerDTO(),
          ...params.settings,
        })
      : WorkspaceSettings.createDefault();

    const workspace = new EditorWorkspace({
      uuid,
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description,
      projectPath: params.projectPath,
      projectType: params.projectType,
      layout,
      settings,
      isActive: false,
      createdAt: now,
      updatedAt: now,
      sessions: [],
    });

    // 发布创建事件
    workspace.addDomainEvent({
      eventType: 'EditorWorkspaceCreated',
      aggregateId: uuid,
      occurredOn: new Date(),
      accountUuid: params.accountUuid,
      payload: {
        workspaceUuid: uuid,
        workspaceName: params.name,
        projectPath: params.projectPath,
        projectType: params.projectType,
      },
    });

    return workspace;
  }

  /**
   * 从 DTO 重建聚合根（用于从数据库恢复）
   */
  public static fromDTO(dto: EditorWorkspaceServerDTO): EditorWorkspace {
    // 递归重建子实体：Session -> Group -> Tab
    const sessions = dto.sessions.map((sessionDto) => EditorSession.fromServerDTO(sessionDto));

    return new EditorWorkspace({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      projectPath: dto.projectPath,
      projectType: dto.projectType,
      layout: WorkspaceLayout.fromServerDTO(dto.layout),
      settings: WorkspaceSettings.fromServerDTO(dto.settings),
      isActive: dto.isActive,
      lastActiveSessionUuid: dto.lastActiveSessionUuid,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      sessions,
    });
  }

  /**
   * 从 Server DTO 重建聚合根
   */
  public static fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspace {
    return EditorWorkspace.fromDTO(dto);
  }

  /**
   * 从 Client DTO 重建聚合根
   */
  public static fromClientDTO(dto: EditorWorkspaceClientDTO): EditorWorkspace {
    // 递归重建子实体
    const sessions = dto.sessions.map((sessionDto) => EditorSession.fromClientDTO(sessionDto));

    return new EditorWorkspace({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      projectPath: dto.projectPath,
      projectType: dto.projectType,
      layout: WorkspaceLayout.fromServerDTO(dto.layout), // 使用 fromServerDTO
      settings: WorkspaceSettings.fromServerDTO(dto.settings), // 使用 fromServerDTO
      isActive: dto.isActive,
      lastActiveSessionUuid: dto.lastActiveSessionUuid,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      sessions,
    });
  }

  /**
   * 从 Persistence DTO 重建聚合根
   */
  public static fromPersistenceDTO(dto: EditorWorkspacePersistenceDTO): EditorWorkspace {
    return new EditorWorkspace({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      projectPath: dto.project_path,
      projectType: dto.project_type,
      layout: WorkspaceLayout.fromPersistenceDTO(JSON.parse(dto.layout)),
      settings: WorkspaceSettings.fromPersistenceDTO(JSON.parse(dto.settings)),
      isActive: dto.is_active,
      lastActiveSessionUuid: dto.last_active_session_uuid,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      sessions: [], // 从持久化层重建时，子实体需要单独加载
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新工作区基本信息
   */
  public update(updates: { name?: string; description?: string | null }): void {
    if (updates.name) {
      this._name = updates.name;
    }
    if (updates.description !== undefined) {
      this._description = updates.description;
    }
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'EditorWorkspaceUpdated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        workspaceUuid: this._uuid,
        changes: updates,
      },
    });
  }

  /**
   * 激活工作区
   */
  public activate(): void {
    if (this._isActive) {
      return; // 已经是活动状态
    }

    this._isActive = true;
    this._lastAccessedAt = Date.now();
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'EditorWorkspaceActivated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        workspaceUuid: this._uuid,
        activatedAt: this._lastAccessedAt,
      },
    });
  }

  /**
   * 取消激活工作区
   */
  public deactivate(): void {
    if (!this._isActive) {
      return; // 已经是非活动状态
    }

    this._isActive = false;
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'EditorWorkspaceDeactivated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        workspaceUuid: this._uuid,
      },
    });
  }

  /**
   * 更新布局配置
   */
  public updateLayout(layout: Partial<WorkspaceLayoutServerDTO>): void {
    this._layout = this._layout.with(layout);
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'EditorWorkspaceLayoutUpdated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        workspaceUuid: this._uuid,
        newLayout: this._layout.toServerDTO(),
      },
    });
  }

  /**
   * 更新设置
   */
  public updateSettings(settings: Partial<WorkspaceSettingsServerDTO>): void {
    this._settings = this._settings.with(settings);
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'EditorWorkspaceSettingsUpdated',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        workspaceUuid: this._uuid,
        newSettings: this._settings.toServerDTO(),
      },
    });
  }

  /**
   * 设置最后活动的会话
   */
  public setLastActiveSession(sessionUuid: string | null): void {
    this._lastActiveSessionUuid = sessionUuid;
    this._updatedAt = new Date();
  }

  /**
   * 记录访问时间
   */
  public recordAccess(): void {
    this._lastAccessedAt = Date.now();
    this._updatedAt = new Date();
  }

  // ===== 子实体管理方法 =====

  /**
   * 添加会话（工厂方法）
   */
  public addSession(params: {
    name: string;
    description?: string;
    layout?: Partial<SessionLayoutServerDTO>;
  }): EditorSession {
    const session = EditorSession.create({
      workspaceUuid: this.uuid,
      accountUuid: this._accountUuid,
      name: params.name,
      description: params.description,
      layout: params.layout,
    });

    this._sessions.push(session);
    this._updatedAt = new Date();

    this.addDomainEvent({
      eventType: 'EditorSessionAdded',
      aggregateId: this._uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        workspaceUuid: this._uuid,
        sessionUuid: session.uuid,
        sessionName: params.name,
      },
    });

    return session;
  }

  /**
   * 添加已存在的会话（用于重建）
   */
  public addExistingSession(session: EditorSession): void {
    this._sessions.push(session);
    this._updatedAt = new Date();
  }

  /**
   * 移除会话
   */
  public removeSession(sessionUuid: string): boolean {
    const index = this._sessions.findIndex((s) => s.uuid === sessionUuid);
    if (index !== -1) {
      this._sessions.splice(index, 1);
      this._updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * 获取会话
   */
  public getSession(sessionUuid: string): EditorSession | undefined {
    return this._sessions.find((s) => s.uuid === sessionUuid);
  }

  /**
   * 获取所有会话
   */
  public getAllSessions(): EditorSession[] {
    return [...this._sessions];
  }

  // ===== DTO 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): EditorWorkspaceServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      projectPath: this._projectPath,
      projectType: this._projectType,
      layout: this._layout.toServerDTO(),
      settings: this._settings.toServerDTO(),
      sessions: this._sessions.map((session) => session.toServerDTO()),
      isActive: this._isActive,
      lastActiveSessionUuid: this._lastActiveSessionUuid,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): EditorWorkspaceClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      projectPath: this._projectPath,
      projectType: this._projectType,
      layout: this._layout.toClientDTO(),
      settings: this._settings.toClientDTO(),
      sessions: this._sessions.map((session) => session.toClientDTO()),
      isActive: this._isActive,
      lastActiveSessionUuid: this._lastActiveSessionUuid,
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

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): EditorWorkspacePersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      project_path: this._projectPath,
      project_type: this._projectType,
      layout: JSON.stringify(this._layout.toPersistenceDTO()),
      settings: JSON.stringify(this._settings.toPersistenceDTO()),
      is_active: this._isActive,
      last_active_session_uuid: this._lastActiveSessionUuid,
      lastAccessedAt: this._lastAccessedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
