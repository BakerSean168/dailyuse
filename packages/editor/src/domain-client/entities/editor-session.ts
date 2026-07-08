/**
 * EditorSession Entity - Domain Client
 * 编辑器会话实体 - 领域客户端
 *
 * ⚠️ 注意：EditorSession 是实体，不是聚合根
 * 所属聚合根: EditorWorkspace
 * 包含子实体: EditorGroup[]
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: EditorSessionState): EditorSession
 * - Instance toDTO(): EditorSessionClientDTO
 */

import type {
  EditorSessionClientDTO,
  ISessionLayout,
} from '@dailyuse/contracts/editor';
import type { EditorSessionId as IEditorSessionId } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils/domain';
import { EditorWorkspaceId } from '../../server/domain/value-objects/editor-workspace-id';
import { EditorSessionId } from '../../server/domain/value-objects/editor-session-id';
import { IdentityId } from '@dailyuse/domain-shared';
import { EditorGroup } from './editor-group';

export interface EditorSessionState {
  id: EditorSessionId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  groups: EditorGroup[];
  isActive: boolean;
  activeGroupIndex: number;
  layout: ISessionLayout;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class EditorSession extends Entity<IEditorSessionId> {
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

  get layout(): ISessionLayout {
    return this._props.layout;
  }

  get groupCount(): number {
    return this._props.groups.length;
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
  public static load(state: EditorSessionState): EditorSession {
    return new EditorSession(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): EditorSessionClientDTO {
    return {
      id: this.id as EditorSessionId,
      workspaceId: this._props.workspaceId as EditorWorkspaceId,
      identityId: this._props.identityId as IdentityId,
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
