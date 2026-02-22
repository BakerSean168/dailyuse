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
  DomainDate,
} from '@dailyuse/contracts/primitives';
import type {
  EditorWorkspaceServerDTO,
  WorkspaceLayoutServerDTO,
  WorkspaceSettingsServerDTO,
} from '@dailyuse/contracts/editor';
import { ProjectType } from '@dailyuse/contracts/editor';
import { EditorWorkspaceId } from '../../domain-shared';
import { WorkspaceLayout } from '../../domain-shared/value-objects/workspace-layout';
import { WorkspaceSettings } from '../../domain-shared/value-objects/workspace-settings';
import { EditorSession } from '../entities/editor-session';

/**
 * EditorWorkspace 状态接口（domain types）
 */
export interface EditorWorkspaceState {
  id: IEditorWorkspaceId;
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

/**
 * EditorWorkspace 聚合根
 */
export class EditorWorkspace extends AggregateRoot<IEditorWorkspaceId> {
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

  private constructor(state: EditorWorkspaceState) {
    super(state.id);
    this._identityId = state.identityId;
    this._name = state.name;
    this._description = state.description;
    this._projectPath = state.projectPath;
    this._projectType = state.projectType;
    this._layout = state.layout;
    this._settings = state.settings;
    this._isActive = state.isActive;
    this._lastActiveSessionId = state.lastActiveSessionId;
    this._lastAccessedAt = state.lastAccessedAt;
    this._createdAt = state.createdAt;
    this._updatedAt = state.updatedAt;
    this._sessions = state.sessions;
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

  /**
   * 从状态恢复聚合根
   */
  static load(state: EditorWorkspaceState): EditorWorkspace {
    return new EditorWorkspace(state);
  }

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

    const workspace = new EditorWorkspace({
      id,
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

}
