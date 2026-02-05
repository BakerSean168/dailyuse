/**
 * Document 实体实现
 * 实现 DocumentServer 接口
 */

import type {
  DocumentId as IDocumentId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
  DomainDate,
  PersistenceDate,
} from '@dailyuse/contracts/primitives';
import type {
  DocumentClientDTO,
  DocumentPersistenceDTO,
  DocumentServer,
  DocumentServerDTO,
  DocumentMetadataServerDTO,
} from '@dailyuse/contracts/editor';
import {
  DocumentLanguage,
  IndexStatus,
} from '@dailyuse/contracts/editor';
import { Entity, generateUUID } from '@dailyuse/utils';
import { DocumentMetadata } from '@dailyuse/domain-shared/editor';

/**
 * Document 实体
 */
export class Document extends Entity<IDocumentId> implements DocumentServer {
  // ===== 私有字段 =====
  private _workspaceId: EditorWorkspaceId;
  private _identityId: IdentityId;
  private _path: string;
  private _name: string;
  private _language: DocumentLanguage;
  private _content: string;
  private _contentHash: string;
  private _metadata: DocumentMetadata;
  private _indexStatus: IndexStatus;
  private _lastIndexedAt: Date | null;
  private _lastModifiedAt: Date | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(
    id: IDocumentId,
    params: {
      workspaceId: EditorWorkspaceId;
      identityId: IdentityId;
      path: string;
      name: string;
      language: DocumentLanguage;
      content: string;
      contentHash: string;
      metadata: DocumentMetadata;
      indexStatus: IndexStatus;
      lastIndexedAt: Date | null;
      lastModifiedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ) {
    super(id);
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

  // ===== Getter 属性 =====
  public get workspaceId(): EditorWorkspaceId {
    return this._workspaceId;
  }

  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get path(): string {
    return this._path;
  }

  public get name(): string {
    return this._name;
  }

  public get language(): DocumentLanguage {
    return this._language;
  }

  public get content(): string {
    return this._content;
  }

  public get contentHash(): string {
    return this._contentHash;
  }

  public get metadata(): DocumentMetadataServerDTO {
    return this._metadata.toServerDTO();
  }

  public get indexStatus(): IndexStatus {
    return this._indexStatus;
  }

  public get lastIndexedAt(): DomainDate | null {
    return this._lastIndexedAt;
  }

  public get lastModifiedAt(): DomainDate | null {
    return this._lastModifiedAt;
  }

  public get createdAt(): DomainDate {
    return this._createdAt;
  }

  public get updatedAt(): DomainDate {
    return this._updatedAt;
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新文档
   */
  public static create(params: {
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    path: string;
    name: string;
    language?: DocumentLanguage;
    content?: string;
    metadata?: DocumentMetadataServerDTO;
  }): Document {
    const id = generateUUID() as IDocumentId;
    const now = new Date();
    const language = params.language ?? Document.detectLanguage(params.name);

    return new Document(id, {
      workspaceId: params.workspaceId,
      identityId: params.identityId,
      path: params.path,
      name: params.name,
      language,
      content: params.content ?? '',
      contentHash: Document.hashContent(params.content ?? ''),
      metadata: params.metadata
        ? DocumentMetadata.fromDTO(params.metadata)
        : DocumentMetadata.createEmpty(),
      indexStatus: IndexStatus.NotIndexed,
      lastIndexedAt: null,
      lastModifiedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 ServerDTO 恢复
   */
  public static fromServerDTO(dto: DocumentServerDTO): Document {
    const id = dto.id;
    return new Document(id, {
      workspaceId: dto.workspaceId,
      identityId: dto.identityId,
      path: dto.path,
      name: dto.name,
      language: dto.language,
      content: dto.content,
      contentHash: dto.contentHash,
      metadata: DocumentMetadata.fromDTO(dto.metadata),
      indexStatus: dto.indexStatus,
      lastIndexedAt: dto.lastIndexedAt ? new Date(dto.lastIndexedAt) : null,
      lastModifiedAt: dto.lastModifiedAt ? new Date(dto.lastModifiedAt) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 PersistenceDTO 恢复
   */
  public static fromPersistenceDTO(dto: DocumentPersistenceDTO): Document {
    const id = dto.id;
    return new Document(id, {
      workspaceId: dto.workspace_id,
      identityId: dto.identityId,
      path: dto.path,
      name: dto.name,
      language: dto.language,
      content: dto.content,
      contentHash: dto.content_hash,
      metadata: DocumentMetadata.fromDTO(JSON.parse(dto.metadata)),
      indexStatus: dto.index_status,
      lastIndexedAt: dto.last_indexed_at ? new Date(dto.last_indexed_at) : null,
      lastModifiedAt: dto.last_modified_at ? new Date(dto.last_modified_at) : null,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新内容
   */
  public updateContent(content: string): void {
    this._content = content;
    this._contentHash = Document.hashContent(content);
    this._indexStatus = IndexStatus.Outdated;
    this._updatedAt = new Date();
  }

  /**
   * 更新元数据
   */
  public updateMetadata(metadata: DocumentMetadataServerDTO): void {
    this._metadata = DocumentMetadata.fromDTO(metadata);
    this._updatedAt = new Date();
  }

  /**
   * 重命名
   */
  public rename(newName: string): void {
    this._name = newName;
    this._language = Document.detectLanguage(newName);
    this._updatedAt = new Date();
  }

  /**
   * 移动到新路径
   */
  public move(newPath: string): void {
    this._path = newPath;
    this._updatedAt = new Date();
  }

  /**
   * 标记为已索引
   */
  public markAsIndexed(): void {
    this._indexStatus = IndexStatus.Indexed;
    this._lastIndexedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 标记索引过期
   */
  public markIndexOutdated(): void {
    this._indexStatus = IndexStatus.Outdated;
    this._updatedAt = new Date();
  }

  /**
   * 标记索引失败
   */
  public markIndexFailed(): void {
    this._indexStatus = IndexStatus.Failed;
    this._updatedAt = new Date();
  }

  /**
   * 更新文件修改时间
   */
  public updateLastModifiedAt(time: Date): void {
    this._lastModifiedAt = time;
    this._updatedAt = new Date();
  }

  /**
   * 获取文件扩展名
   */
  public getExtension(): string {
    const parts = this._name.split('.');
    return parts.length > 1 ? parts.pop() ?? '' : '';
  }

  /**
   * 是否为 Markdown 文档
   */
  public isMarkdown(): boolean {
    return this._language === DocumentLanguage.Markdown;
  }

  // ===== 序列化方法 =====

  public toServerDTO(): DocumentServerDTO {
    return {
      id: this.id,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      path: this._path,
      name: this._name,
      language: this._language,
      content: this._content,
      contentHash: this._contentHash,
      metadata: this._metadata.toServerDTO(),
      indexStatus: this._indexStatus,
      lastIndexedAt: this._lastIndexedAt?.getTime() as TransferDate | null,
      lastModifiedAt: this._lastModifiedAt?.getTime() as TransferDate | null,
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
    };
  }

  public toClientDTO(): DocumentClientDTO {
    const serverMetadata = this._metadata.toServerDTO();
    return {
      id: this.id,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      path: this._path,
      name: this._name,
      language: this._language,
      content: this._content,
      contentHash: this._contentHash,
      metadata: {
        tags: serverMetadata.tags,
        category: serverMetadata.category,
        wordCount: serverMetadata.wordCount,
        characterCount: serverMetadata.characterCount,
        readingTime: serverMetadata.readingTime,
        wordCountFormatted: this._metadata.wordCountFormatted,
        readingTimeFormatted: this._metadata.readingTimeFormatted,
      },
      indexStatus: this._indexStatus,
      lastIndexedAt: this._lastIndexedAt?.getTime() as TransferDate | null,
      lastModifiedAt: this._lastModifiedAt?.getTime() as TransferDate | null,
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
      formattedLastIndexed: this._lastIndexedAt?.toLocaleString() ?? null,
      formattedLastModified: this._lastModifiedAt?.toLocaleString() ?? null,
      formattedCreatedAt: this._createdAt.toLocaleString(),
      formattedUpdatedAt: this._updatedAt.toLocaleString(),
    };
  }

  public toPersistenceDTO(): DocumentPersistenceDTO {
    return {
      id: this.id,
      workspace_id: this._workspaceId,
      identityId: this._identityId,
      path: this._path,
      name: this._name,
      language: this._language,
      content: this._content,
      content_hash: this._contentHash,
      metadata: JSON.stringify(this._metadata.toServerDTO()),
      index_status: this._indexStatus,
      last_indexed_at: this._lastIndexedAt as PersistenceDate | null,
      last_modified_at: this._lastModifiedAt as PersistenceDate | null,
      createdAt: this._createdAt as PersistenceDate,
      updatedAt: this._updatedAt as PersistenceDate,
    };
  }

  // ===== 私有辅助方法 =====

  private static hashContent(content: string): string {
    // 简单哈希实现
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private static detectLanguage(name: string): DocumentLanguage {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const languageMap: Record<string, DocumentLanguage> = {
      'md': DocumentLanguage.Markdown,
      'markdown': DocumentLanguage.Markdown,
      'txt': DocumentLanguage.Plaintext,
      'html': DocumentLanguage.Html,
      'htm': DocumentLanguage.Html,
      'json': DocumentLanguage.Json,
      'ts': DocumentLanguage.Typescript,
      'tsx': DocumentLanguage.Typescript,
      'js': DocumentLanguage.Javascript,
      'jsx': DocumentLanguage.Javascript,
      'py': DocumentLanguage.Python,
      'java': DocumentLanguage.Java,
      'go': DocumentLanguage.Go,
      'rs': DocumentLanguage.Rust,
    };
    return languageMap[ext] ?? DocumentLanguage.Other;
  }
}
