/**
 * EditorWorkspace Aggregate Root - Domain Client
 * 编辑器工作区聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 EditorWorkspaceClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: EditorWorkspaceClientDTO): EditorWorkspace
 * - Instance toDTO(): EditorWorkspaceClientDTO
 */

import type {
  EditorWorkspaceClient,
  EditorWorkspaceClientDTO,
  WorkspaceLayoutClientDTO,
  WorkspaceSettingsClientDTO,
  ProjectType,
} from '@dailyuse/contracts/editor';
import type { DomainDate } from '@dailyuse/contracts/primitives';
import { AggregateRoot } from '@dailyuse/utils';
import {
  EditorWorkspaceId,
  EditorSessionId,
} from '@dailyuse/domain-shared/editor';
import { IdentityId } from '@dailyuse/domain-shared';
import { EditorSession } from '../entities/editor-session';

export class EditorWorkspace extends AggregateRoot<EditorWorkspaceId> implements EditorWorkspaceClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _projectPath: string;
  private _projectType: ProjectType;
  private _layout: WorkspaceLayoutClientDTO;
  private _settings: WorkspaceSettingsClientDTO;
  private _sessions: EditorSession[];
  private _isActive: boolean;
  private _lastActiveSessionId: EditorSessionId | null;
  private _lastAccessedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: EditorWorkspaceId;
    identityId: IdentityId;
    name: string;
    description: string | null;
    projectPath: string;
    projectType: ProjectType;
    layout: WorkspaceLayoutClientDTO;
    settings: WorkspaceSettingsClientDTO;
    sessions: EditorSession[];
    isActive: boolean;
    lastActiveSessionId: EditorSessionId | null;
    lastAccessedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._description = params.description;
    this._projectPath = params.projectPath;
    this._projectType = params.projectType;
    this._layout = params.layout;
    this._settings = params.settings;
    this._sessions = params.sessions;
    this._isActive = params.isActive;
    this._lastActiveSessionId = params.lastActiveSessionId;
    this._lastAccessedAt = params.lastAccessedAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ================= 3. Getters =================
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

  get layout(): WorkspaceLayoutClientDTO {
    return this._layout;
  }

  get settings(): WorkspaceSettingsClientDTO {
    return this._settings;
  }

  get sessions(): EditorSession[] {
    return [...this._sessions];
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

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: EditorWorkspaceClientDTO): EditorWorkspace {
    return new EditorWorkspace({
      id: EditorWorkspaceId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      description: dto.description,
      projectPath: dto.projectPath,
      projectType: dto.projectType,
      layout: dto.layout,
      settings: dto.settings,
      sessions: dto.sessions.map((s) => EditorSession.fromDTO(s)),
      isActive: dto.isActive,
      lastActiveSessionId: dto.lastActiveSessionId
        ? EditorSessionId.of(dto.lastActiveSessionId)
        : null,
      lastAccessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): EditorWorkspaceClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      description: this._description,
      projectPath: this._projectPath,
      projectType: this._projectType,
      layout: this._layout,
      settings: this._settings,
      sessions: this._sessions.map((s) => s.toDTO()),
      isActive: this._isActive,
      lastActiveSessionId: this._lastActiveSessionId
        ? String(this._lastActiveSessionId)
        : null,
      lastAccessedAt: this._lastAccessedAt?.getTime() ?? null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      formattedLastAccessed: this._lastAccessedAt
        ? this.formatRelativeTime(this._lastAccessedAt)
        : null,
      formattedCreatedAt: this.formatDate(this._createdAt),
      formattedUpdatedAt: this.formatRelativeTime(this._updatedAt),
    };
  }

  // ================= 6. Private Helpers =================
  private formatRelativeTime(date: Date): string {
    const now = Date.now();
    const diff = now - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 30) return `${days} 天前`;
    return this.formatDate(date);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
