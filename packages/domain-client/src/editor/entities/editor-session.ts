/**
 * EditorSession Entity - Domain Client
 * 编辑器会话实体 - 领域客户端
 *
 * ⚠️ 注意：EditorSession 是实体，不是聚合根
 * 所属聚合根: EditorWorkspace
 * 包含子实体: EditorGroup[]
 *
 * 【规范说明】
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: EditorSessionClientDTO): EditorSession
 * - Instance toDTO(): EditorSessionClientDTO
 */

import type {
  EditorSessionClientDTO,
  SessionLayoutClientDTO,
} from '@dailyuse/contracts/editor';
import type { EditorSessionId } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils';
import { EditorWorkspaceId } from '@dailyuse/domain-shared/editor';
import { IdentityId } from '@dailyuse/domain-shared';
import { EditorGroup } from './editor-group';

export class EditorSession extends Entity<EditorSessionId> {
  // ================= 1. Backing Fields =================
  private _workspaceId: EditorWorkspaceId;
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _groups: EditorGroup[];
  private _isActive: boolean;
  private _activeGroupIndex: number;
  private _layout: SessionLayoutClientDTO;
  private _lastAccessedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: EditorSessionId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    name: string;
    description: string | null;
    groups: EditorGroup[];
    isActive: boolean;
    activeGroupIndex: number;
    layout: SessionLayoutClientDTO;
    lastAccessedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._workspaceId = params.workspaceId;
    this._identityId = params.identityId;
    this._name = params.name;
    this._description = params.description;
    this._groups = params.groups;
    this._isActive = params.isActive;
    this._activeGroupIndex = params.activeGroupIndex;
    this._layout = params.layout;
    this._lastAccessedAt = params.lastAccessedAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ================= 3. Getters =================
  get workspaceId(): EditorWorkspaceId {
    return this._workspaceId;
  }

  get identityId(): IdentityId {
    return this._identityId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get groups(): EditorGroup[] {
    return [...this._groups];
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get activeGroupIndex(): number {
    return this._activeGroupIndex;
  }

  get layout(): SessionLayoutClientDTO {
    return this._layout;
  }

  get groupCount(): number {
    return this._groups.length;
  }

  get lastAccessedAt(): Date | null {
    return this._lastAccessedAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: EditorSessionClientDTO): EditorSession {
    return new EditorSession({
      id: dto.id as EditorSessionId,
      workspaceId: EditorWorkspaceId.of(dto.workspaceId),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      description: dto.description,
      groups: dto.groups.map((g) => EditorGroup.fromDTO(g)),
      isActive: dto.isActive,
      activeGroupIndex: dto.activeGroupIndex,
      layout: dto.layout,
      lastAccessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): EditorSessionClientDTO {
    return {
      id: String(this.id),
      workspaceId: String(this._workspaceId),
      identityId: String(this._identityId),
      name: this._name,
      description: this._description,
      groups: this._groups.map((g) => g.toDTO()),
      isActive: this._isActive,
      activeGroupIndex: this._activeGroupIndex,
      layout: this._layout,
      groupCount: this._groups.length,
      lastAccessedAt: this._lastAccessedAt?.getTime() ?? null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }
}
