/**
 * EditorWorkspace 聚合根实现
 * 编辑器工作区聚合根 - 服务端实现
 */

import { AggregateRoot } from '@dailyuse/utils/domain';
import type {
  EditorWorkspaceId as IEditorWorkspaceId,
  EditorSessionId,
  IdentityId,
  TransferDate,
  DomainDate,
} from '@dailyuse/contracts/primitives';
import type {
  EditorWorkspaceServerDTO,
  EditorWorkspaceClientDTO,
  WorkspaceLayoutDTO,
  WorkspaceSettingsDTO,
  EditorEventMap,
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
  private _props: EditorWorkspaceState;

  private constructor(state: EditorWorkspaceState) {
    super(state.id);
    this._props = state;
  }

  // ===== Getters =====

  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get name(): string {
    return this._props.name;
  }

  get description(): string | null {
    return this._props.description;
  }

  get projectPath(): string {
    return this._props.projectPath;
  }

  get projectType(): ProjectType {
    return this._props.projectType;
  }

  get layout(): WorkspaceLayoutDTO {
    return this._props.layout.toDTO();
  }

  get settings(): WorkspaceSettingsDTO {
    return this._props.settings.toDTO();
  }

  get isActive(): boolean {
    return this._props.isActive;
  }

  get lastActiveSessionId(): EditorSessionId | null {
    return this._props.lastActiveSessionId;
  }

  get lastAccessedAt(): DomainDate | null {
    return this._props.lastAccessedAt;
  }

  get createdAt(): DomainDate {
    return this._props.createdAt;
  }

  get updatedAt(): DomainDate {
    return this._props.updatedAt;
  }

  get sessions(): EditorSession[] {
    return [...this._props.sessions];
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
    layout?: WorkspaceLayoutDTO;
    settings?: WorkspaceSettingsDTO;
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
      workspace._props.sessions.push(defaultSession);
      workspace._props.lastActiveSessionId = defaultSession.id;
    }

    workspace.addDomainEvent<EditorEventMap['editor:workspace-created']>('editor:workspace-created', {
      identityId: params.identityId,
      name: params.name,
      projectPath: params.projectPath,
      projectType: params.projectType ?? ProjectType.Other,
    });

    return workspace;
  }

  // ===== Business Methods =====

  updateName(name: string): void {
    this._props.name = name;
    this._props.updatedAt = new Date();

    this.addDomainEvent<EditorEventMap['editor:workspace-updated']>('editor:workspace-updated', {
      changedFields: ['name'],
    });
  }

  updateDescription(description: string | null): void {
    this._props.description = description;
    this._props.updatedAt = new Date();

    this.addDomainEvent<EditorEventMap['editor:workspace-updated']>('editor:workspace-updated', {
      changedFields: ['description'],
    });
  }

  updateProjectPath(projectPath: string): void {
    this._props.projectPath = projectPath;
    this._props.updatedAt = new Date();

    this.addDomainEvent<EditorEventMap['editor:workspace-updated']>('editor:workspace-updated', {
      changedFields: ['projectPath'],
    });
  }

  updateLayout(layout: Partial<WorkspaceLayoutDTO>): void {
    this._props.layout = this._props.layout.with(layout);
    this._props.updatedAt = new Date();

    this.addDomainEvent<EditorEventMap['editor:workspace-updated']>('editor:workspace-updated', {
      changedFields: ['layout'],
    });
  }

  updateSettings(settings: Partial<WorkspaceSettingsDTO>): void {
    this._props.settings = this._props.settings.with(settings);
    this._props.updatedAt = new Date();

    this.addDomainEvent<EditorEventMap['editor:workspace-updated']>('editor:workspace-updated', {
      changedFields: ['settings'],
    });
  }

  activate(): void {
    this._props.isActive = true;
    this._props.lastAccessedAt = new Date();
    this._props.updatedAt = new Date();
  }

  deactivate(): void {
    this._props.isActive = false;
    this._props.updatedAt = new Date();
  }

  delete(): void {
    this._props.updatedAt = new Date();

    this.addDomainEvent<EditorEventMap['editor:workspace-deleted']>('editor:workspace-deleted', {
      workspaceId: this.id,
    });
  }

  addSession(session: EditorSession): void {
    this._props.sessions.push(session);
    this._props.lastActiveSessionId = session.id;
    this._props.updatedAt = new Date();
  }

  removeSession(sessionId: EditorSessionId): boolean {
    const index = this._props.sessions.findIndex((s) => s.id === sessionId);
    if (index === -1) return false;

    this._props.sessions.splice(index, 1);
    if (this._props.lastActiveSessionId === sessionId) {
      this._props.lastActiveSessionId = this._props.sessions[0]?.id ?? null;
    }
    this._props.updatedAt = new Date();
    return true;
  }

  setActiveSession(sessionId: EditorSessionId): void {
    const session = this._props.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found in workspace`);
    }
    this._props.lastActiveSessionId = sessionId;
    this._props.lastAccessedAt = new Date();
    this._props.updatedAt = new Date();
  }

  getSession(sessionId: EditorSessionId): EditorSession | undefined {
    return this._props.sessions.find((s) => s.id === sessionId);
  }

  getActiveSession(): EditorSession | undefined {
    if (!this._props.lastActiveSessionId) return undefined;
    return this._props.sessions.find((s) => s.id === this._props.lastActiveSessionId);
  }

  // ===== Serialization =====

  toServerDTO(): EditorWorkspaceServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      projectPath: this._props.projectPath,
      projectType: this._props.projectType,
      layout: this._props.layout.toDTO(),
      settings: this._props.settings.toDTO(),
      sessions: this._props.sessions.map((s) => s.toServerDTO()),
      isActive: this._props.isActive,
      lastActiveSessionId: this._props.lastActiveSessionId,
      lastAccessedAt: this._props.lastAccessedAt ? (this._props.lastAccessedAt.getTime() as TransferDate) : null,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
    };
  }

  toClientDTO(): EditorWorkspaceClientDTO {
    const settingsServerDTO = this._props.settings.toDTO();
    const autoSave = settingsServerDTO.autoSave ?? { enabled: false, interval: 0 };

    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      projectPath: this._props.projectPath,
      projectType: this._props.projectType,
      layout: this._props.layout.toDTO(),
      settings: {
        theme: settingsServerDTO.theme ?? 'default',
        fontSize: settingsServerDTO.fontSize ?? 14,
        fontFamily: settingsServerDTO.fontFamily ?? 'Consolas',
        lineHeight: settingsServerDTO.lineHeight ?? 1.5,
        tabSize: settingsServerDTO.tabSize ?? 2,
        wordWrap: settingsServerDTO.wordWrap ?? true,
        lineNumbers: settingsServerDTO.lineNumbers ?? true,
        minimap: settingsServerDTO.minimap ?? true,
        autoSave,
      },
      sessions: this._props.sessions.map((s) => s.toClientDTO()),
      isActive: this._props.isActive,
      lastActiveSessionId: this._props.lastActiveSessionId,
      lastAccessedAt: this._props.lastAccessedAt ? this._props.lastAccessedAt.getTime() : null,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      formattedLastAccessed: this._props.lastAccessedAt ? this._props.lastAccessedAt.toLocaleString() : null,
      formattedCreatedAt: this._props.createdAt.toLocaleDateString(),
      formattedUpdatedAt: this._props.updatedAt.toLocaleString(),
    };
  }

}
