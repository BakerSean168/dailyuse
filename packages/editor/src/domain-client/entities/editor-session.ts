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
  EditorSessionClient,
  EditorSessionClientDTO,
  SessionLayoutClient,
} from '@dailyuse/contracts/editor';
import type { EditorSessionId as IEditorSessionId, DomainDate } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils';
import { EditorWorkspaceId, EditorSessionId } from '@/domain-shared';
import { IdentityId } from '@dailyuse/domain-shared';
import { EditorGroup } from './editor-group';

// 内部状态接口：使用 domain-shared 类类型
interface EditorSessionState {
  id: EditorSessionId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  groups: EditorGroup[];
  isActive: boolean;
  activeGroupIndex: number;
  layout: SessionLayoutClient;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class EditorSession extends Entity<IEditorSessionId> implements EditorSessionClient {
  // ================= 1. Backing Field =================
  private readonly _props: EditorSessionState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: EditorSessionState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }

  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get name(): string {
    return this._props.name;
  }

  get description(): string | null {
    return this._props.description;
  }

  get groups(): EditorGroup[] {
    return [...this._props.groups];
  }

  get isActive(): boolean {
    return this._props.isActive;
  }

  get activeGroupIndex(): number {
    return this._props.activeGroupIndex;
  }

  get layout(): SessionLayoutClient {
    return this._props.layout;
  }

  get groupCount(): number {
    return this._props.groups.length;
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

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: EditorSessionClientDTO): EditorSession {
    return new EditorSession({
      id: EditorSessionId.of(dto.id),
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
      workspaceId: String(this._props.workspaceId),
      identityId: String(this._props.identityId),
      name: this._props.name,
      description: this._props.description,
      groups: this._props.groups.map((g) => g.toDTO()),
      isActive: this._props.isActive,
      activeGroupIndex: this._props.activeGroupIndex,
      layout: this._props.layout,
      groupCount: this._props.groups.length,
      lastAccessedAt: this._props.lastAccessedAt?.getTime() ?? null,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
    };
  }
}
