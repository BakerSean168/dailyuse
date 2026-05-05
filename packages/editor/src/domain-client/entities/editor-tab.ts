/**
 * EditorTab Entity - Domain Client
 * 编辑器标签页实体 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: EditorTabState): EditorTab
 * - Instance toDTO(): EditorTabClientDTO
 */

import type {
  EditorTabClientDTO,
  TabViewStateDTO,
  TabType,
} from '@dailyuse/contracts/editor';
import { Entity } from '@dailyuse/utils';
import { EditorTabId } from '../../domain-shared/value-objects/editor-tab-id';
import { EditorGroupId } from '../../domain-shared/value-objects/editor-group-id';
import { EditorSessionId } from '../../domain-shared/value-objects/editor-session-id';
import { EditorWorkspaceId } from '../../domain-shared/value-objects/editor-workspace-id';
import { IdentityId } from '@dailyuse/domain-shared';

export interface EditorTabState {
  id: EditorTabId;
  groupId: EditorGroupId;
  sessionId: EditorSessionId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  resourceId: string | null;
  tabIndex: number;
  tabType: TabType;
  name: string;
  viewState: TabViewStateDTO;
  isPinned: boolean;
  isDirty: boolean;
  lastAccessedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class EditorTab extends Entity<EditorTabId> {
  // ================= 1. Backing Field =================
  private readonly _props: EditorTabState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: EditorTabState) {
    super(props.id);
    this._props = props;
  }

  // ================= 3. Getters =================
  get groupId(): EditorGroupId {
    return this._props.groupId;
  }

  get sessionId(): EditorSessionId {
    return this._props.sessionId;
  }

  get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }

  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get resourceId(): string | null {
    return this._props.resourceId;
  }

  get tabIndex(): number {
    return this._props.tabIndex;
  }

  get tabType(): TabType {
    return this._props.tabType;
  }

  get name(): string {
    return this._props.name;
  }

  get viewState(): TabViewStateDTO {
    return this._props.viewState;
  }

  get isPinned(): boolean {
    return this._props.isPinned;
  }

  get isDirty(): boolean {
    return this._props.isDirty;
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
  public static load(state: EditorTabState): EditorTab {
    return new EditorTab(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): EditorTabClientDTO {
    return {
      id: String(this.id),
      groupId: String(this._props.groupId),
      sessionId: String(this._props.sessionId),
      workspaceId: String(this._props.workspaceId),
      identityId: String(this._props.identityId),
      resourceId: this._props.resourceId,
      tabIndex: this._props.tabIndex,
      tabType: this._props.tabType,
      name: this._props.name,
      viewState: this._props.viewState,
      isPinned: this._props.isPinned,
      isActive: false,
      isDirty: this._props.isDirty,
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
