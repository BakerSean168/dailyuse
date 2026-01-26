/**
 * SearchEngine 实体实现
 * 实现 SearchEngineServer 接口
 */

import type {
  SearchEngineClientDTO,
  SearchEnginePersistenceDTO,
  SearchEngineServer,
  SearchEngineServerDTO,
} from '@dailyuse/contracts/editor';
import { Entity } from '@dailyuse/utils';

/**
 * SearchEngine 实体
 */
export class SearchEngine extends Entity implements SearchEngineServer {
  // ===== 私有字段 =====
  private _workspaceUuid: string; // 聚合根外键
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _indexPath: string;
  private _indexedDocumentCount: number;
  private _totalDocumentCount: number;
  private _lastIndexedAt: number | null;
  private _isIndexing: boolean;
  private _indexProgress: number | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    workspaceUuid: string;
    accountUuid: string;
    name: string;
    description?: string | null;
    indexPath: string;
    indexedDocumentCount: number;
    totalDocumentCount: number;
    lastIndexedAt?: number | null;
    isIndexing: boolean;
    indexProgress?: number | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._workspaceUuid = params.workspaceUuid;
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._description = params.description ?? null;
    this._indexPath = params.indexPath;
    this._indexedDocumentCount = params.indexedDocumentCount;
    this._totalDocumentCount = params.totalDocumentCount;
    this._lastIndexedAt = params.lastIndexedAt ?? null;
    this._isIndexing = params.isIndexing;
    this._indexProgress = params.indexProgress ?? null;
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
  public get name(): string {
    return this._name;
  }
  public get description(): string | null {
    return this._description;
  }
  public get indexPath(): string {
    return this._indexPath;
  }
  public get indexedDocumentCount(): number {
    return this._indexedDocumentCount;
  }
  public get totalDocumentCount(): number {
    return this._totalDocumentCount;
  }
  public get lastIndexedAt(): number | null {
    return this._lastIndexedAt;
  }
  public get isIndexing(): boolean {
    return this._isIndexing;
  }
  public get indexProgress(): number | null {
    return this._indexProgress;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 SearchEngine
   */
  public static create(params: {
    workspaceUuid: string;
    accountUuid: string;
    name: string;
    description?: string;
    indexPath: string;
  }): SearchEngine {
    const uuid = crypto.randomUUID();
    const now = new Date();

    return new SearchEngine({
      uuid,
      workspaceUuid: params.workspaceUuid,
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description,
      indexPath: params.indexPath,
      indexedDocumentCount: 0,
      totalDocumentCount: 0,
      isIndexing: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 DTO 重建
   */
  public static fromDTO(dto: SearchEngineServerDTO): SearchEngine {
    return new SearchEngine({
      uuid: dto.uuid,
      workspaceUuid: dto.workspaceUuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      indexPath: dto.indexPath,
      indexedDocumentCount: dto.indexedDocumentCount,
      totalDocumentCount: dto.totalDocumentCount,
      lastIndexedAt: dto.lastIndexedAt,
      isIndexing: dto.isIndexing,
      indexProgress: dto.indexProgress,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 Persistence DTO 重建
   */
  public static fromPersistenceDTO(dto: SearchEnginePersistenceDTO): SearchEngine {
    return new SearchEngine({
      uuid: dto.uuid,
      workspaceUuid: dto.workspace_uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      indexPath: dto.index_path,
      indexedDocumentCount: dto.indexed_document_count,
      totalDocumentCount: dto.total_document_count,
      lastIndexedAt: dto.last_indexed_at,
      isIndexing: dto.is_indexing,
      indexProgress: dto.index_progress,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ===== 业务方法 =====

  /**
   * 开始索引
   */
  public startIndexing(totalDocumentCount: number): void {
    if (this._isIndexing) {
      throw new Error('搜索引擎已在索引中');
    }
    this._isIndexing = true;
    this._totalDocumentCount = totalDocumentCount;
    this._indexedDocumentCount = 0;
    this._indexProgress = 0;
    this._updatedAt = new Date();
  }

  /**
   * 更新索引进度
   */
  public updateProgress(indexedCount: number, totalCount: number): void {
    if (!this._isIndexing) {
      throw new Error('搜索引擎未在索引中');
    }
    this._indexedDocumentCount = indexedCount;
    this._totalDocumentCount = totalCount;
    this._indexProgress = totalCount > 0 ? Math.floor((indexedCount / totalCount) * 100) : 0;
    this._updatedAt = new Date();
  }

  /**
   * 完成索引
   */
  public completeIndexing(): void {
    if (!this._isIndexing) {
      throw new Error('搜索引擎未在索引中');
    }
    this._isIndexing = false;
    this._indexProgress = 100;
    this._lastIndexedAt = Date.now();
    this._updatedAt = new Date();
  }

  /**
   * 取消索引
   */
  public cancelIndexing(): void {
    if (!this._isIndexing) {
      return;
    }
    this._isIndexing = false;
    this._indexProgress = null;
    this._updatedAt = new Date();
  }

  /**
   * 重置索引
   */
  public resetIndex(): void {
    this._isIndexing = false;
    this._indexedDocumentCount = 0;
    this._totalDocumentCount = 0;
    this._indexProgress = null;
    this._lastIndexedAt = null;
    this._updatedAt = new Date();
  }

  /**
   * 增量索引单个文档
   */
  public indexDocument(): void {
    this._indexedDocumentCount++;
    this._totalDocumentCount = Math.max(this._totalDocumentCount, this._indexedDocumentCount);
    if (this._isIndexing && this._totalDocumentCount > 0) {
      this._indexProgress = Math.floor(
        (this._indexedDocumentCount / this._totalDocumentCount) * 100,
      );
    }
    this._lastIndexedAt = Date.now();
    this._updatedAt = new Date();
  }

  /**
   * 判断索引是否完整
   */
  public isIndexComplete(): boolean {
    return (
      !this._isIndexing &&
      this._indexedDocumentCount > 0 &&
      this._indexedDocumentCount >= this._totalDocumentCount
    );
  }

  /**
   * 判断索引是否过期（需要重建）
   */
  public isIndexOutdated(threshold: number): boolean {
    if (!this._lastIndexedAt) {
      return true;
    }
    const elapsed = Date.now() - this._lastIndexedAt;
    return elapsed > threshold;
  }

  // ===== DTO 转换方法 =====

  public toServerDTO(): SearchEngineServerDTO {
    return {
      uuid: this._uuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      indexPath: this._indexPath,
      indexedDocumentCount: this._indexedDocumentCount,
      totalDocumentCount: this._totalDocumentCount,
      lastIndexedAt: this._lastIndexedAt,
      isIndexing: this._isIndexing,
      indexProgress: this._indexProgress,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
    };
  }

  public toClientDTO(): SearchEngineClientDTO {
    return {
      uuid: this._uuid,
      workspaceUuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      indexPath: this._indexPath,
      indexedDocumentCount: this._indexedDocumentCount,
      totalDocumentCount: this._totalDocumentCount,
      lastIndexedAt: this._lastIndexedAt,
      isIndexing: this._isIndexing,
      indexProgress: this._indexProgress,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      formattedLastIndexed: this._lastIndexedAt
        ? new Date(this._lastIndexedAt).toLocaleString()
        : null,
      formattedCreatedAt: this._createdAt.toLocaleString(),
      formattedUpdatedAt: this._updatedAt.toLocaleString(),
    };
  }

  public toPersistenceDTO(): SearchEnginePersistenceDTO {
    return {
      uuid: this._uuid,
      workspace_uuid: this._workspaceUuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      index_path: this._indexPath,
      indexed_document_count: this._indexedDocumentCount,
      total_document_count: this._totalDocumentCount,
      last_indexed_at: this._lastIndexedAt,
      is_indexing: this._isIndexing,
      index_progress: this._indexProgress,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
