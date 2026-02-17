/**
 * EditorWorkspace 聚合根实现
 * 编辑器工作区聚合根 - 服务端实现
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  EditorWorkspaceId as IEditorWorkspaceId,
  EditorSessionId,
  IdentityId,
  TransferDate,
  PersistenceDate,
  DomainDate,
} from '@dailyuse/contracts/primitives';
import type {
  EditorWorkspaceServer,
  EditorWorkspaceServerDTO,
  EditorWorkspacePersistenceDTO,
  EditorSessionServerDTO,
  WorkspaceLayoutServerDTO,
  WorkspaceSettingsServerDTO,
} from '@dailyuse/contracts/editor';
import { ProjectType } from '@dailyuse/contracts/editor';
import { EditorWorkspaceId } from '../../domain-shared';
import { WorkspaceLayout } from '../../domain-shared/value-objects/workspace-layout';
import { WorkspaceSettings } from '../../domain-shared/value-objects/workspace-settings';
import { EditorSession } from '../entities/editor-session';

/**
 * EditorWorkspace 聚合根
 */
export class EditorWorkspace extends AggregateRoot<IEditorWorkspaceId> implements EditorWorkspaceServer {
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _projectPath: string;
  private _projectType: ProjectType;
  private _layout: WorkspaceLayout;
  private _settings: WorkspaceSettings;
  private _isActive: boolean;
  private _lastActiveSessionId: EditorSessionId | null;
  private _lastAccessedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _sessions: EditorSession[];

  private constructor(
    id: IEditorWorkspaceId,
    params: {
      identityId: IdentityId;
      name: string;
      description: string | null;
      projectPath: string;
      projectType: ProjectType;
      layout: WorkspaceLayout;
      settings: WorkspaceSettings;
      isActive: boolean;
      lastActiveSessionId: EditorSessionId | null;
      lastAccessedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      sessions: EditorSession[];
    }
  ) {
    super(id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._description = params.description;
    this._projectPath = params.projectPath;
    this._projectType = params.projectType;
    this._layout = params.layout;
    this._settings = params.settings;
    this._isActive = params.isActive;
    this._lastActiveSessionId = params.lastActiveSessionId;
    this._lastAccessedAt = params.lastAccessedAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._sessions = params.sessions;
  }

  // ===== Getters =====

  get identityId(): IdentityId {
    return this._identityId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get projectPath(): string {
    return this._projectPath;
  }

  get projectType(): ProjectType {
    return this._projectType;
  }

  get layout(): WorkspaceLayoutServerDTO {
    return this._layout.toServerDTO();
  }

  get settings(): WorkspaceSettingsServerDTO {
    return this._settings.toServerDTO();
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get lastActiveSessionId(): EditorSessionId | null {
    return this._lastActiveSessionId;
  }

  get lastAccessedAt(): DomainDate | null {
    return this._lastAccessedAt;
  }

  get createdAt(): DomainDate {
    return this._createdAt;
  }

  get updatedAt(): DomainDate {
    return this._updatedAt;
  }

  get sessions(): EditorSession[] {
    return [...this._sessions];
  }

  // ===== Factory Methods =====

  static create(params: {
    identityId: IdentityId;
    name: string;
    description?: string;
    projectPath: string;
    projectType?: ProjectType;
    layout?: WorkspaceLayoutServerDTO;
    settings?: WorkspaceSettingsServerDTO;
    createDefaultSession?: boolean;
  }): EditorWorkspace {
    const id = EditorWorkspaceId.of(EditorWorkspaceId.generate());
    const now = new Date();

    const workspace = new EditorWorkspace(id, {
      identityId: params.identityId,
      name: params.name,
      description: params.description ?? null,
      projectPath: params.projectPath,
      projectType: params.projectType ?? ProjectType.Other,
      layout: params.layout ? WorkspaceLayout.fromDTO(params.layout) : WorkspaceLayout.createDefault(),
      settings: params.settings ? WorkspaceSettings.fromDTO(params.settings) : WorkspaceSettings.createDefault(),
      isActive: false,
      lastActiveSessionId: null,
      lastAccessedAt: null,
      createdAt: now,
      updatedAt: now,
      sessions: [],
    });

    if (params.createDefaultSession !== false) {
      const defaultSession = EditorSession.create({
        workspaceId: id,
        identityId: params.identityId,
        name: 'Default Session',
      });
      workspace._sessions.push(defaultSession);
      workspace._lastActiveSessionId = defaultSession.id;
    }

    return workspace;
  }

  static fromServerDTO(dto: EditorWorkspaceServerDTO): EditorWorkspace {
    const id = EditorWorkspaceId.of(dto.id);
    const sessions = dto.sessions?.map((s) => EditorSession.fromServerDTO(s)) ?? [];

    return new EditorWorkspace(id, {
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      projectPath: dto.projectPath,
      projectType: dto.projectType,
      layout: WorkspaceLayout.fromDTO(dto.layout),
      settings: WorkspaceSettings.fromDTO(dto.settings),
      isActive: dto.isActive,
      lastActiveSessionId: dto.lastActiveSessionId,
      lastAccessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      sessions,
    });
  }

  static fromPersistenceDTO(
    dto: EditorWorkspacePersistenceDTO,
    sessions?: EditorSession[]
  ): EditorWorkspace {
    const id = EditorWorkspaceId.of(dto.id);
    const layoutData = typeof dto.layout === 'string' ? JSON.parse(dto.layout) : dto.layout;
    const settingsData = typeof dto.settings === 'string' ? JSON.parse(dto.settings) : dto.settings;

    return new EditorWorkspace(id, {
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      projectPath: dto.project_path,
      projectType: dto.project_type,
      layout: WorkspaceLayout.fromDTO(layoutData),
      settings: WorkspaceSettings.fromDTO(settingsData),
      isActive: dto.is_active,
      lastActiveSessionId: dto.last_active_session_id,
      lastAccessedAt: dto.lastAccessedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      sessions: sessions ?? [],
    });
  }

  // ===== Business Methods =====

  updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  updateProjectPath(projectPath: string): void {
    this._projectPath = projectPath;
    this._updatedAt = new Date();
  }

  updateLayout(layout: Partial<WorkspaceLayoutServerDTO>): void {
    this._layout = this._layout.with(layout);
    this._updatedAt = new Date();
  }

  updateSettings(settings: Partial<WorkspaceSettingsServerDTO>): void {
    this._settings = this._settings.with(settings);
    this._updatedAt = new Date();
  }

  activate(): void {
    this._isActive = true;
    this._lastAccessedAt = new Date();
    this._updatedAt = new Date();
  }

  deactivate(): void {
    this._isActive = false;
    this._updatedAt = new Date();
  }

  addSession(session: EditorSession): void {
    this._sessions.push(session);
    this._lastActiveSessionId = session.id;
    this._updatedAt = new Date();
  }

  removeSession(sessionId: EditorSessionId): boolean {
    const index = this._sessions.findIndex((s) => s.id === sessionId);
    if (index === -1) return false;

    this._sessions.splice(index, 1);
    if (this._lastActiveSessionId === sessionId) {
      this._lastActiveSessionId = this._sessions[0]?.id ?? null;
    }
    this._updatedAt = new Date();
    return true;
  }

  setActiveSession(sessionId: EditorSessionId): void {
    const session = this._sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found in workspace`);
    }
    this._lastActiveSessionId = sessionId;
    this._lastAccessedAt = new Date();
    this._updatedAt = new Date();
  }

  getSession(sessionId: EditorSessionId): EditorSession | undefined {
    return this._sessions.find((s) => s.id === sessionId);
  }

  getActiveSession(): EditorSession | undefined {
    if (!this._lastActiveSessionId) return undefined;
    return this._sessions.find((s) => s.id === this._lastActiveSessionId);
  }

  // ===== Serialization =====

  toServerDTO(): EditorWorkspaceServerDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._name,
      description: this._description,
      projectPath: this._projectPath,
      projectType: this._projectType,
      layout: this._layout.toServerDTO(),
      settings: this._settings.toServerDTO(),
      sessions: this._sessions.map((s) => s.toServerDTO()),
      isActive: this._isActive,
      lastActiveSessionId: this._lastActiveSessionId,
      lastAccessedAt: this._lastAccessedAt ? (this._lastAccessedAt.getTime() as TransferDate) : null,
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
    };
  }

  toPersistenceDTO(): EditorWorkspacePersistenceDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._name,
      description: this._description,
      project_path: this._projectPath,
      project_type: this._projectType,
      layout: JSON.stringify(this._layout.toServerDTO()),
      settings: JSON.stringify(this._settings.toServerDTO()),
      is_active: this._isActive,
      last_active_session_id: this._lastActiveSessionId,
      lastAccessedAt: this._lastAccessedAt as PersistenceDate | null,
      createdAt: this._createdAt as PersistenceDate,
      updatedAt: this._updatedAt as PersistenceDate,
    };
  }
}
