/**
 * EditorWorkspace Aggregate Root - Domain Client
 * 编辑器工作区聚合根 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: EditorWorkspaceState): EditorWorkspace
 * - Instance toDTO(): EditorWorkspaceClientDTO
 */

import type {
  EditorWorkspaceClientDTO,
  IWorkspaceLayout,
  IWorkspaceSettings,
  ProjectType,
} from '@dailyuse/contracts/editor';
import { AggregateRoot } from '@dailyuse/utils';
import { EditorWorkspaceId } from '../../domain-shared/value-objects/editor-workspace-id';
import { EditorSessionId } from '../../domain-shared/value-objects/editor-session-id';
import { IdentityId } from '@dailyuse/domain-shared';
import { EditorSession } from '../entities/editor-session';

export interface EditorWorkspaceState {
  id: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  projectPath: string;
  projectType: ProjectType;
  layout: IWorkspaceLayout;
  settings: IWorkspaceSettings;
  sessions: EditorSession[];
  isActive: boolean;
  lastActiveSessionId: EditorSessionId | null;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class EditorWorkspace extends AggregateRoot<EditorWorkspaceId> {
  // ================= 1. Backing Field =================
  private readonly _props: EditorWorkspaceState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: EditorWorkspaceState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
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

  get layout(): IWorkspaceLayout {
    return this._props.layout;
  }

  get settings(): IWorkspaceSettings {
    return this._props.settings;
  }

  get sessions(): EditorSession[] {
    return [...this._props.sessions];
  }

  get isActive(): boolean {
    return this._props.isActive;
  }

  get lastActiveSessionId(): EditorSessionId | null {
    return this._props.lastActiveSessionId;
  }

  get lastAccessedAt(): Date | null {
    return this._props.lastAccessedAt;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ================= 4. Factory Methods =================
  public static load(state: EditorWorkspaceState): EditorWorkspace {
    return new EditorWorkspace(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): EditorWorkspaceClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._props.identityId),
      name: this._props.name,
      description: this._props.description,
      projectPath: this._props.projectPath,
      projectType: this._props.projectType,
      layout: this._props.layout,
      settings: this._props.settings,
      sessions: this._props.sessions.map((s) => s.toDTO()),
      isActive: this._props.isActive,
      lastActiveSessionId: this._props.lastActiveSessionId
        ? String(this._props.lastActiveSessionId)
        : null,
      lastAccessedAt: this._props.lastAccessedAt?.getTime() ?? null,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      formattedLastAccessed: this._props.lastAccessedAt
        ? this.formatRelativeTime(this._props.lastAccessedAt)
        : null,
      formattedCreatedAt: this.formatDate(this._props.createdAt),
      formattedUpdatedAt: this.formatRelativeTime(this._props.updatedAt),
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
