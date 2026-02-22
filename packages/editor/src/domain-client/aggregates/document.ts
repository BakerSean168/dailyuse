/**
 * Document Entity - Domain Client
 * 文档实体 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with props object
 * - Public getters via this._props.xxx
 * - Static load(state: DocumentState): Document
 * - Instance toDTO(): DocumentClientDTO
 */

import type {
  DocumentClientDTO,
  DocumentMetadataClientDTO,
  DocumentLanguage,
  IndexStatus,
} from '@dailyuse/contracts/editor';
import type { DocumentId as IDocumentId } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils';
import { EditorWorkspaceId } from '../../domain-shared/value-objects/editor-workspace-id';
import { DocumentId } from '../../domain-shared/value-objects/document-id';
import { IdentityId } from '@dailyuse/domain-shared';

export interface DocumentState {
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
}

export class Document extends Entity<IDocumentId> {
  // ================= 1. Backing Field =================
  private readonly _props: DocumentState;

  // ================= 2. Constructor (Private) =================
  private constructor(props: DocumentState) {
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

  get path(): string {
    return this._props.path;
  }

  get name(): string {
    return this._props.name;
  }

  get language(): DocumentLanguage {
    return this._props.language;
  }

  get content(): string {
    return this._props.content;
  }

  get contentHash(): string {
    return this._props.contentHash;
  }

  get metadata(): DocumentMetadataClientDTO {
    return this._props.metadata;
  }

  get indexStatus(): IndexStatus {
    return this._props.indexStatus;
  }

  get lastIndexedAt(): Date | null {
    return this._props.lastIndexedAt;
  }

  get lastModifiedAt(): Date | null {
    return this._props.lastModifiedAt;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ================= 4. Factory Methods =================
  public static load(state: DocumentState): Document {
    return new Document(state);
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): DocumentClientDTO {
    return {
      id: String(this.id),
      workspaceId: String(this._props.workspaceId),
      identityId: String(this._props.identityId),
      path: this._props.path,
      name: this._props.name,
      language: this._props.language,
      content: this._props.content,
      contentHash: this._props.contentHash,
      metadata: this._props.metadata,
      indexStatus: this._props.indexStatus,
      lastIndexedAt: this._props.lastIndexedAt?.getTime() ?? null,
      lastModifiedAt: this._props.lastModifiedAt?.getTime() ?? null,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      formattedLastIndexed: this._props.lastIndexedAt
        ? this.formatRelativeTime(this._props.lastIndexedAt)
        : null,
      formattedLastModified: this._props.lastModifiedAt
        ? this.formatRelativeTime(this._props.lastModifiedAt)
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
