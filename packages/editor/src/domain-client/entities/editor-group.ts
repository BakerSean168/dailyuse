/**
 * EditorGroup Entity - Domain Client
 * 编辑器分组实体 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: EditorGroupState): EditorGroup
 * - Instance toDTO(): EditorGroupClientDTO
 */

import type {
  EditorGroupClientDTO,
} from '@dailyuse/contracts/editor';
import { Entity } from '@dailyuse/utils';
import { EditorGroupId } from '../../domain-shared/value-objects/editor-group-id';
import { EditorSessionId } from '../../domain-shared/value-objects/editor-session-id';
import { EditorWorkspaceId } from '../../domain-shared/value-objects/editor-workspace-id';
import { IdentityId } from '@dailyuse/domain-shared';
import { EditorTab } from './editor-tab';

export interface EditorGroupState {
  id: EditorGroupId;
  sessionId: EditorSessionId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  groupIndex: number;
  activeTabIndex: number;
  name: string | null;
  tabs: EditorTab[];
  createdAt: Date;
  updatedAt: Date;
}

export class EditorGroup extends Entity<EditorGroupId> {
  // ================= 1. Backing Field =================
  private readonly _props: EditorGroupState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: EditorGroupState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get sessionId(): EditorSessionId {
    return this._props.sessionId;
  }

  get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }

  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get groupIndex(): number {
    return this._props.groupIndex;
  }

  get activeTabIndex(): number {
    return this._props.activeTabIndex;
  }

  get name(): string | null {
    return this._props.name;
  }

  get tabs(): EditorTab[] {
    return [...this._props.tabs];
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ================= 4. Factory Methods =================
  public static load(state: EditorGroupState): EditorGroup {
    return new EditorGroup(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): EditorGroupClientDTO {
    return {
      id: this.id as EditorGroupId,
      sessionId: this._props.sessionId as EditorSessionId,
      workspaceId: this._props.workspaceId as EditorWorkspaceId,
      identityId: this._props.identityId as IdentityId,
      groupIndex: this._props.groupIndex,
      activeTabIndex: this._props.activeTabIndex,
      name: this._props.name,
      tabs: this._props.tabs.map((t) => t.toDTO()),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
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
