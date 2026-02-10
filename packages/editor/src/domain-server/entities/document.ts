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
import { DocumentMetadata } from '@/domain-shared';

/**
 * Document 内部状态接口
 */
interface DocumentState {
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
}

/**
 * Document 实体
 */
export class Document extends Entity<IDocumentId> implements DocumentServer {
  // ===== 私有属性 =====
  private _props: DocumentState;

  // ===== 构造函数（私有） =====
  private constructor(id: IDocumentId, props: DocumentState) {
    super(id);
    this._props = props;
  }

  // ===== Getter 属性 =====
  public get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get path(): string {
    return this._props.path;
  }

  public get name(): string {
    return this._props.name;
  }

  public get language(): DocumentLanguage {
    return this._props.language;
  }

  public get content(): string {
    return this._props.content;
  }

  public get contentHash(): string {
    return this._props.contentHash;
  }

  public get metadata(): DocumentMetadataServerDTO {
    return this._props.metadata.toServerDTO();
  }

  public get indexStatus(): IndexStatus {
    return this._props.indexStatus;
  }

  public get lastIndexedAt(): DomainDate | null {
    return this._props.lastIndexedAt;
  }

  public get lastModifiedAt(): DomainDate | null {
    return this._props.lastModifiedAt;
  }

  public get createdAt(): DomainDate {
    return this._props.createdAt;
  }

  public get updatedAt(): DomainDate {
    return this._props.updatedAt;
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
    this._props.content = content;
    this._props.contentHash = Document.hashContent(content);
    this._props.indexStatus = IndexStatus.Outdated;
    this._props.updatedAt = new Date();
  }

  /**
   * 更新元数据
   */
  public updateMetadata(metadata: DocumentMetadataServerDTO): void {
    this._props.metadata = DocumentMetadata.fromDTO(metadata);
    this._props.updatedAt = new Date();
  }

  /**
   * 重命名
   */
  public rename(newName: string): void {
    this._props.name = newName;
    this._props.language = Document.detectLanguage(newName);
    this._props.updatedAt = new Date();
  }

  /**
   * 移动到新路径
   */
  public move(newPath: string): void {
    this._props.path = newPath;
    this._props.updatedAt = new Date();
  }

  /**
   * 标记为已索引
   */
  public markAsIndexed(): void {
    this._props.indexStatus = IndexStatus.Indexed;
    this._props.lastIndexedAt = new Date();
    this._props.updatedAt = new Date();
  }

  /**
   * 标记索引过期
   */
  public markIndexOutdated(): void {
    this._props.indexStatus = IndexStatus.Outdated;
    this._props.updatedAt = new Date();
  }

  /**
   * 标记索引失败
   */
  public markIndexFailed(): void {
    this._props.indexStatus = IndexStatus.Failed;
    this._props.updatedAt = new Date();
  }

  /**
   * 更新文件修改时间
   */
  public updateLastModifiedAt(time: Date): void {
    this._props.lastModifiedAt = time;
    this._props.updatedAt = new Date();
  }

  /**
   * 获取文件扩展名
   */
  public getExtension(): string {
    const parts = this._props.name.split('.');
    return parts.length > 1 ? parts.pop() ?? '' : '';
  }

  /**
   * 是否为 Markdown 文档
   */
  public isMarkdown(): boolean {
    return this._props.language === DocumentLanguage.Markdown;
  }

  // ===== 序列化方法 =====

  public toServerDTO(): DocumentServerDTO {
    return {
      id: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      path: this._props.path,
      name: this._props.name,
      language: this._props.language,
      content: this._props.content,
      contentHash: this._props.contentHash,
      metadata: this._props.metadata.toServerDTO(),
      indexStatus: this._props.indexStatus,
      lastIndexedAt: this._props.lastIndexedAt?.getTime() as TransferDate | null,
      lastModifiedAt: this._props.lastModifiedAt?.getTime() as TransferDate | null,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
    };
  }

  public toClientDTO(): DocumentClientDTO {
    const serverMetadata = this._props.metadata.toServerDTO();
    return {
      id: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      path: this._props.path,
      name: this._props.name,
      language: this._props.language,
      content: this._props.content,
      contentHash: this._props.contentHash,
      metadata: {
        tags: serverMetadata.tags,
        category: serverMetadata.category,
        wordCount: serverMetadata.wordCount,
        characterCount: serverMetadata.characterCount,
        readingTime: serverMetadata.readingTime,
        wordCountFormatted: this._props.metadata.wordCountFormatted,
        readingTimeFormatted: this._props.metadata.readingTimeFormatted,
      },
      indexStatus: this._props.indexStatus,
      lastIndexedAt: this._props.lastIndexedAt?.getTime() as TransferDate | null,
      lastModifiedAt: this._props.lastModifiedAt?.getTime() as TransferDate | null,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
      formattedLastIndexed: this._props.lastIndexedAt?.toLocaleString() ?? null,
      formattedLastModified: this._props.lastModifiedAt?.toLocaleString() ?? null,
      formattedCreatedAt: this._props.createdAt.toLocaleString(),
      formattedUpdatedAt: this._props.updatedAt.toLocaleString(),
    };
  }

  public toPersistenceDTO(): DocumentPersistenceDTO {
    return {
      id: this.id,
      workspace_id: this._props.workspaceId,
      identityId: this._props.identityId,
      path: this._props.path,
      name: this._props.name,
      language: this._props.language,
      content: this._props.content,
      content_hash: this._props.contentHash,
      metadata: JSON.stringify(this._props.metadata.toServerDTO()),
      index_status: this._props.indexStatus,
      last_indexed_at: this._props.lastIndexedAt as PersistenceDate | null,
      last_modified_at: this._props.lastModifiedAt as PersistenceDate | null,
      createdAt: this._props.createdAt as PersistenceDate,
      updatedAt: this._props.updatedAt as PersistenceDate,
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
