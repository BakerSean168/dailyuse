/**
 * EditorGroup Entity - Domain Client
 * 编辑器分组实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 EditorGroupClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: EditorGroupClientDTO): EditorGroup
 * - Instance toDTO(): EditorGroupClientDTO
 */

import type {
  EditorGroupClient,
  EditorGroupClientDTO,
} from '@dailyuse/contracts/editor';
import type { DomainDate } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils';
import {
  EditorGroupId,
  EditorSessionId,
  EditorWorkspaceId,
} from '@dailyuse/domain-shared/editor';
import { IdentityId } from '@dailyuse/domain-shared';
import { EditorTab } from './editor-tab';

export class EditorGroup extends Entity<EditorGroupId> implements EditorGroupClient {
  // ================= 1. Backing Fields =================
  private _sessionId: EditorSessionId;
  private _workspaceId: EditorWorkspaceId;
  private _identityId: IdentityId;
  private _groupIndex: number;
  private _activeTabIndex: number;
  private _name: string | null;
  private _tabs: EditorTab[];
  private _createdAt: Date;
  private _updatedAt: Date;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
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
  }) {
    super(params.id);
    this._sessionId = params.sessionId;
    this._workspaceId = params.workspaceId;
    this._identityId = params.identityId;
    this._groupIndex = params.groupIndex;
    this._activeTabIndex = params.activeTabIndex;
    this._name = params.name;
    this._tabs = params.tabs;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ================= 3. Getters =================
  get sessionId(): EditorSessionId {
    return this._sessionId;
  }

  get workspaceId(): EditorWorkspaceId {
    return this._workspaceId;
  }

  get identityId(): IdentityId {
    return this._identityId;
  }

  get groupIndex(): number {
    return this._groupIndex;
  }

  get activeTabIndex(): number {
    return this._activeTabIndex;
  }

  get name(): string | null {
    return this._name;
  }

  get tabs(): EditorTab[] {
    return [...this._tabs];
  }

  get createdAt(): DomainDate {
    return this._createdAt;
  }

  get updatedAt(): DomainDate {
    return this._updatedAt;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: EditorGroupClientDTO): EditorGroup {
    return new EditorGroup({
      id: EditorGroupId.of(dto.id),
      sessionId: EditorSessionId.of(dto.sessionId),
      workspaceId: EditorWorkspaceId.of(dto.workspaceId),
      identityId: IdentityId.of(dto.identityId),
      groupIndex: dto.groupIndex,
      activeTabIndex: dto.activeTabIndex,
      name: dto.name,
      tabs: dto.tabs.map((t) => EditorTab.fromDTO(t)),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): EditorGroupClientDTO {
    return {
      id: String(this.id),
      sessionId: String(this._sessionId),
      workspaceId: String(this._workspaceId),
      identityId: String(this._identityId),
      groupIndex: this._groupIndex,
      activeTabIndex: this._activeTabIndex,
      name: this._name,
      tabs: this._tabs.map((t) => t.toDTO()),
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
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
