/**
 * EditorTab Entity - Domain Client
 * 编辑器标签页实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 EditorTabClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: EditorTabClientDTO): EditorTab
 * - Instance toDTO(): EditorTabClientDTO
 */

import type {
  EditorTabClient,
  EditorTabClientDTO,
  TabViewStateClientDTO,
  TabType,
} from '@dailyuse/contracts/editor';
import type { DocumentId, DomainDate } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils';
import {
  EditorTabId,
  EditorGroupId,
  EditorSessionId,
  EditorWorkspaceId,
} from '@dailyuse/domain-shared/editor';
import { IdentityId } from '@dailyuse/domain-shared';

export class EditorTab extends Entity<EditorTabId> implements EditorTabClient {
  // ================= 1. Backing Fields =================
  private _groupId: EditorGroupId;
  private _sessionId: EditorSessionId;
  private _workspaceId: EditorWorkspaceId;
  private _identityId: IdentityId;
  private _documentId: DocumentId | null;
  private _tabIndex: number;
  private _tabType: TabType;
  private _name: string;
  private _viewState: TabViewStateClientDTO;
  private _isPinned: boolean;
  private _isDirty: boolean;
  private _lastAccessedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: EditorTabId;
    groupId: EditorGroupId;
    sessionId: EditorSessionId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    documentId: DocumentId | null;
    tabIndex: number;
    tabType: TabType;
    name: string;
    viewState: TabViewStateClientDTO;
    isPinned: boolean;
    isDirty: boolean;
    lastAccessedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._groupId = params.groupId;
    this._sessionId = params.sessionId;
    this._workspaceId = params.workspaceId;
    this._identityId = params.identityId;
    this._documentId = params.documentId;
    this._tabIndex = params.tabIndex;
    this._tabType = params.tabType;
    this._name = params.name;
    this._viewState = params.viewState;
    this._isPinned = params.isPinned;
    this._isDirty = params.isDirty;
    this._lastAccessedAt = params.lastAccessedAt;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ================= 3. Getters =================
  get groupId(): EditorGroupId {
    return this._groupId;
  }

  get sessionId(): EditorSessionId {
    return this._sessionId;
  }

  get workspaceId(): EditorWorkspaceId {
    return this._workspaceId;
  }

  get identityId(): IdentityId {
    return this._identityId;
  }

  get documentId(): DocumentId | null {
    return this._documentId;
  }

  get tabIndex(): number {
    return this._tabIndex;
  }

  get tabType(): TabType {
    return this._tabType;
  }

  get name(): string {
    return this._name;
  }

  get viewState(): TabViewStateClientDTO {
    return this._viewState;
  }

  get isPinned(): boolean {
    return this._isPinned;
  }

  get isDirty(): boolean {
    return this._isDirty;
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
  public static fromDTO(dto: EditorTabClientDTO): EditorTab {
    return new EditorTab({
      id: EditorTabId.of(dto.id),
      groupId: EditorGroupId.of(dto.groupId),
      sessionId: EditorSessionId.of(dto.sessionId),
      workspaceId: EditorWorkspaceId.of(dto.workspaceId),
      identityId: IdentityId.of(dto.identityId),
      documentId: dto.documentId as DocumentId | null,
      tabIndex: dto.tabIndex,
      tabType: dto.tabType,
      name: dto.name,
      viewState: dto.viewState,
      isPinned: dto.isPinned,
      isDirty: dto.isDirty,
      lastAccessedAt: dto.lastAccessedAt ? new Date(dto.lastAccessedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): EditorTabClientDTO {
    return {
      id: String(this.id),
      groupId: String(this._groupId),
      sessionId: String(this._sessionId),
      workspaceId: String(this._workspaceId),
      identityId: String(this._identityId),
      documentId: this._documentId ? String(this._documentId) : null,
      tabIndex: this._tabIndex,
      tabType: this._tabType,
      name: this._name,
      viewState: this._viewState,
      isPinned: this._isPinned,
      isDirty: this._isDirty,
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
