/**
 * Document Entity - Domain Client
 * 文档实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 DocumentClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: DocumentClientDTO): Document
 * - Instance toDTO(): DocumentClientDTO
 */

import type {
  DocumentClient,
  DocumentClientDTO,
  DocumentMetadataClientDTO,
  DocumentLanguage,
  IndexStatus,
} from '@dailyuse/contracts/editor';
import type { DocumentId, DomainDate } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils';
import { EditorWorkspaceId } from '@dailyuse/domain-shared/editor';
import { IdentityId } from '@dailyuse/domain-shared';

export class Document extends Entity<DocumentId> implements DocumentClient {
  // ================= 1. Backing Fields =================
  private _workspaceId: EditorWorkspaceId;
  private _identityId: IdentityId;
  private _path: string;
  private _name: string;
  private _language: DocumentLanguage;
  private _content: string;
  private _contentHash: string;
  private _metadata: DocumentMetadataClientDTO;
  private _indexStatus: IndexStatus;
  private _lastIndexedAt: Date | null;
  private _lastModifiedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: DocumentId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    path: string;
    name: string;
    language: DocumentLanguage;
    content: string;
    contentHash: string;
    metadata: DocumentMetadataClientDTO;
    indexStatus: IndexStatus;
    lastIndexedAt: Date | null;
    lastModifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._workspaceId = params.workspaceId;
    this._identityId = params.identityId;
    this._path = params.path;
    this._name = params.name;
    this._language = params.language;
    this._content = params.content;
    this._contentHash = params.contentHash;
    this._metadata = params.metadata;
    this._indexStatus = params.indexStatus;
    this._lastIndexedAt = params.lastIndexedAt;
    this._lastModifiedAt = params.lastModifiedAt;
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

  get path(): string {
    return this._path;
  }

  get name(): string {
    return this._name;
  }

  get language(): DocumentLanguage {
    return this._language;
  }

  get content(): string {
    return this._content;
  }

  get contentHash(): string {
    return this._contentHash;
  }

  get metadata(): DocumentMetadataClientDTO {
    return this._metadata;
  }

  get indexStatus(): IndexStatus {
    return this._indexStatus;
  }

  get lastIndexedAt(): DomainDate | null {
    return this._lastIndexedAt;
  }

  get lastModifiedAt(): DomainDate | null {
    return this._lastModifiedAt;
  }

  get createdAt(): DomainDate {
    return this._createdAt;
  }

  get updatedAt(): DomainDate {
    return this._updatedAt;
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: DocumentClientDTO): Document {
    return new Document({
      id: dto.id as DocumentId,
      workspaceId: EditorWorkspaceId.of(dto.workspaceId),
      identityId: IdentityId.of(dto.identityId),
      path: dto.path,
      name: dto.name,
      language: dto.language,
      content: dto.content,
      contentHash: dto.contentHash,
      metadata: dto.metadata,
      indexStatus: dto.indexStatus,
      lastIndexedAt: dto.lastIndexedAt ? new Date(dto.lastIndexedAt) : null,
      lastModifiedAt: dto.lastModifiedAt ? new Date(dto.lastModifiedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): DocumentClientDTO {
    return {
      id: String(this.id),
      workspaceId: String(this._workspaceId),
      identityId: String(this._identityId),
      path: this._path,
      name: this._name,
      language: this._language,
      content: this._content,
      contentHash: this._contentHash,
      metadata: this._metadata,
      indexStatus: this._indexStatus,
      lastIndexedAt: this._lastIndexedAt?.getTime() ?? null,
      lastModifiedAt: this._lastModifiedAt?.getTime() ?? null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      formattedLastIndexed: this._lastIndexedAt
        ? this.formatRelativeTime(this._lastIndexedAt)
        : null,
      formattedLastModified: this._lastModifiedAt
        ? this.formatRelativeTime(this._lastModifiedAt)
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
