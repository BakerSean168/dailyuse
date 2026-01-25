/**
 * Document 实体实现
 * 实现 DocumentServer 接口
 */

import {
  DocumentLanguage,
  IndexStatus,
} from '@dailyuse/contracts/editor';
import type {
  DocumentClientDTO,
  DocumentMetadataServerDTO,
  DocumentPersistenceDTO,
  DocumentServer,
  DocumentServerDTO,
} from '@dailyuse/contracts/editor';
import { Entity } from '@dailyuse/utils';
import { DocumentMetadata } from '../value-objects/DocumentMetadata';

/**
 * Document 实体
 */
export class Document extends Entity implements DocumentServer {
  // ===== 私有字段 =====
  private _workspaceUuid: string; // 聚合根外键
  private _accountUuid: string;
  private _path: string;
  private _name: string;
  private _language: DocumentLanguage;
  private _content: string;
  private _contentHash: string;
  private _metadata: DocumentMetadata;
  private _indexStatus: IndexStatus;
  private _lastIndexedAt: number | null;
  private _lastModifiedAt: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    workspaceUuid: string;
    accountUuid: string;
    path: string;
    name: string;
    language: DocumentLanguage;
    content: string;
    contentHash: string;
    metadata: DocumentMetadata;
    indexStatus: IndexStatus;
    lastIndexedAt?: number | null;
    lastModifiedAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._workspaceUuid = params.workspaceUuid;
    this._accountUuid = params.accountUuid;
    this._path = params.path;
    this._name = params.name;
    this._language = params.language;
    this._content = params.content;
    this._contentHash = params.contentHash;
    this._metadata = params.metadata;
    this._indexStatus = params.indexStatus;
    this._lastIndexedAt = params.lastIndexedAt ?? null;
    this._lastModifiedAt = params.lastModifiedAt ?? null;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get workspaceUuid(): string {
    return this._workspaceUuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
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
  public get lastIndexedAt(): number | null {
    return this._lastIndexedAt;
  }
  public get lastModifiedAt(): number | null {
    return this._lastModifiedAt;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 Document
   */
  public static create(params: {
    workspaceUuid: string;
    accountUuid: string;
    path: string;
    name: string;
    language: DocumentLanguage;
    content: string;
    metadata?: Partial<DocumentMetadataServerDTO>;
  }): Document {
    const uuid = crypto.randomUUID();
    const now = Date.now();
    const contentHash = Document.calculateHash(params.content);

    const metadata = params.metadata
      ? DocumentMetadata.fromServerDTO({
          ...DocumentMetadata.createDefault().toServerDTO(),
          ...params.metadata,
        })
      : DocumentMetadata.createDefault();

    return new Document({
      uuid,
      workspaceUuid: params.workspaceUuid,
      accountUuid: params.accountUuid,
      path: params.path,
      name: params.name,
      language: params.language,
      content: params.content,
      contentHash,
      metadata,
      indexStatus: IndexStatus.NOT_INDEXED,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 DTO 重建
   */
  public static fromDTO(dto: DocumentServerDTO): Document {
    return new Document({
      uuid: dto.uuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      path: dto.path,
      name: dto.name,
      language: dto.language,
      content: dto.content,
      contentHash: dto.contentHash,
      metadata: DocumentMetadata.fromServerDTO(dto.metadata),
      indexStatus: dto.indexStatus,
      lastIndexedAt: dto.lastIndexedAt,
      lastModifiedAt: dto.lastModifiedAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 Persistence DTO 重建
   */
  public static fromPersistenceDTO(dto: DocumentPersistenceDTO): Document {
    return new Document({
      uuid: dto.uuid,
      workspaceUuid: dto.workspace_uuid,
      accountUuid: dto.accountUuid,
      path: dto.path,
      name: dto.name,
      language: dto.language,
      content: dto.content,
      contentHash: dto.content_hash,
      metadata: DocumentMetadata.fromPersistenceDTO(JSON.parse(dto.metadata)),
      indexStatus: dto.index_status,
      lastIndexedAt: dto.last_indexed_at?.getTime() ?? null,
      lastModifiedAt: dto.last_modified_at?.getTime() ?? null,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新文档内容
   */
  public updateContent(content: string, contentHash: string): void {
    this._content = content;
    this._contentHash = contentHash;
    this._indexStatus = IndexStatus.OUTDATED;
    this._updatedAt = Date.now();
  }

  /**
   * 更新元数据
   */
  public updateMetadata(metadata: Partial<DocumentMetadataServerDTO>): void {
    this._metadata = this._metadata.with(metadata);
    this._updatedAt = Date.now();
  }

  /**
   * 重命名文档
   */
  public rename(newName: string): void {
    this._name = newName;
    this._updatedAt = Date.now();
  }

  /**
   * 移动文档
   */
  public move(newPath: string): void {
    this._path = newPath;
    this._updatedAt = Date.now();
  }

  /**
   * 标记为已索引
   */
  public markIndexed(): void {
    this._indexStatus = IndexStatus.INDEXED;
    this._lastIndexedAt = Date.now();
    this._updatedAt = this._lastIndexedAt;
  }

  /**
   * 标记索引过期
   */
  public markIndexOutdated(): void {
    this._indexStatus = IndexStatus.OUTDATED;
    this._updatedAt = Date.now();
  }

  /**
   * 标记索引失败
   */
  public markIndexFailed(): void {
    this._indexStatus = IndexStatus.FAILED;
    this._updatedAt = Date.now();
  }

  /**
   * 更新文件修改时间
   */
  public updateFileModifiedTime(timestamp: number): void {
    this._lastModifiedAt = timestamp;
    this._updatedAt = Date.now();
  }

  /**
   * 获取文件扩展名
   */
  public getFileExtension(): string {
    const lastDot = this._name.lastIndexOf('.');
    return lastDot !== -1 ? this._name.substring(lastDot + 1) : '';
  }

  /**
   * 判断是否为 Markdown 文档
   */
  public isMarkdown(): boolean {
    return this._language === DocumentLanguage.MARKDOWN;
  }

  // ===== DTO 转换方法 =====

  public toServerDTO(): DocumentServerDTO {
    return {
      uuid: this._uuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      path: this._path,
      name: this._name,
      language: this._language,
      content: this._content,
      contentHash: this._contentHash,
      metadata: this._metadata.toServerDTO(),
      indexStatus: this._indexStatus,
      lastIndexedAt: this._lastIndexedAt,
      lastModifiedAt: this._lastModifiedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  public toClientDTO(): DocumentClientDTO {
    return {
      uuid: this._uuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      path: this._path,
      name: this._name,
      language: this._language,
      content: this._content,
      contentHash: this._contentHash,
      metadata: this._metadata.toClientDTO(),
      indexStatus: this._indexStatus,
      lastIndexedAt: this._lastIndexedAt,
      lastModifiedAt: this._lastModifiedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      formattedLastIndexed: this._lastIndexedAt
        ? new Date(this._lastIndexedAt).toLocaleString()
        : null,
      formattedLastModified: this._lastModifiedAt
        ? new Date(this._lastModifiedAt).toLocaleString()
        : null,
      formattedCreatedAt: new Date(this._createdAt).toLocaleString(),
      formattedUpdatedAt: new Date(this._updatedAt).toLocaleString(),
    };
  }

  public toPersistenceDTO(): DocumentPersistenceDTO {
    return {
      uuid: this._uuid,
      workspace_uuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      path: this._path,
      name: this._name,
      language: this._language,
      content: this._content,
      content_hash: this._contentHash,
      metadata: JSON.stringify(this._metadata.toPersistenceDTO()),
      index_status: this._indexStatus,
      last_indexed_at: this._lastIndexedAt ? new Date(this._lastIndexedAt) : null,
      last_modified_at: this._lastModifiedAt ? new Date(this._lastModifiedAt) : null,
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
    };
  }

  // ===== 辅助方法 =====

  /**
   * 计算内容哈希
   */
  private static calculateHash(content: string): string {
    // 简单的哈希实现，实际应用中应使用更强的哈希算法
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}
