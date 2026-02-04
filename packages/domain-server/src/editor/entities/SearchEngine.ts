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
import type {
  SearchEngineId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
} from '@dailyuse/contracts/primitives';
import { Entity, generateUUID } from '@dailyuse/utils';

/**
 * SearchEngine 实体
 */
export class SearchEngine extends Entity<SearchEngineId> implements SearchEngineServer {
  // ===== 私有字段 =====
  private _workspaceId: EditorWorkspaceId;
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _indexPath: string;
  private _indexedDocumentCount: number;
  private _totalDocumentCount: number;
  private _lastIndexedAt: Date | null;
  private _isIndexing: boolean;
  private _indexProgress: number | null;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    id: SearchEngineId;
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    name: string;
    description?: string | null;
    indexPath: string;
    indexedDocumentCount: number;
    totalDocumentCount: number;
    lastIndexedAt?: Date | null;
    isIndexing: boolean;
    indexProgress?: number | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(params.id);
    this._workspaceId = params.workspaceId;
    this._identityId = params.identityId;
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
  public get workspaceId(): EditorWorkspaceId {
    return this._workspaceId;
  }

  public get identityId(): IdentityId {
    return this._identityId;
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

  public get lastIndexedAt(): Date | null {
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
  public static create(params: {
    workspaceId: EditorWorkspaceId;
    identityId: IdentityId;
    name: string;
    description?: string;
    indexPath: string;
  }): SearchEngine {
    const now = new Date();
    return new SearchEngine({
      id: generateUUID() as SearchEngineId,
      workspaceId: params.workspaceId,
      identityId: params.identityId,
      name: params.name,
      description: params.description ?? null,
      indexPath: params.indexPath,
      indexedDocumentCount: 0,
      totalDocumentCount: 0,
      lastIndexedAt: null,
      isIndexing: false,
      indexProgress: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromServerDTO(dto: SearchEngineServerDTO): SearchEngine {
    return new SearchEngine({
      id: dto.id,
      workspaceId: dto.workspaceId,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      indexPath: dto.indexPath,
      indexedDocumentCount: dto.indexedDocumentCount,
      totalDocumentCount: dto.totalDocumentCount,
      lastIndexedAt: dto.lastIndexedAt !== null ? new Date(dto.lastIndexedAt) : null,
      isIndexing: dto.isIndexing,
      indexProgress: dto.indexProgress,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  public static fromPersistenceDTO(dto: SearchEnginePersistenceDTO): SearchEngine {
    return new SearchEngine({
      id: dto.id,
      workspaceId: dto.workspace_id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      indexPath: dto.index_path,
      indexedDocumentCount: dto.indexed_document_count,
      totalDocumentCount: dto.total_document_count,
      lastIndexedAt: dto.last_indexed_at !== null ? new Date(dto.last_indexed_at) : null,
      isIndexing: dto.is_indexing,
      indexProgress: dto.index_progress,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ===== 业务方法 =====
  public startIndexing(totalDocumentCount: number): void {
    this._isIndexing = true;
    this._indexProgress = 0;
    this._totalDocumentCount = totalDocumentCount;
    this._updatedAt = new Date();
  }

  public updateIndexProgress(progress: number, indexedCount: number): void {
    if (!this._isIndexing) return;
    this._indexProgress = Math.min(100, Math.max(0, progress));
    this._indexedDocumentCount = indexedCount;
    this._updatedAt = new Date();
  }

  public finishIndexing(): void {
    this._isIndexing = false;
    this._indexProgress = 100;
    this._lastIndexedAt = new Date();
    this._updatedAt = new Date();
  }

  public cancelIndexing(): void {
    this._isIndexing = false;
    this._indexProgress = null;
    this._updatedAt = new Date();
  }

  public rename(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  public updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  // ===== 计算属性 =====
  public get indexPercentage(): number {
    return this._indexProgress ?? 0;
  }

  public get hasIndexedDocuments(): boolean {
    return this._indexedDocumentCount > 0;
  }

  public get isFullyIndexed(): boolean {
    return this._indexedDocumentCount === this._totalDocumentCount && this._totalDocumentCount > 0;
  }

  public get lastIndexedAtFormatted(): string | null {
    return this._lastIndexedAt?.toLocaleString() ?? null;
  }

  // ===== 序列化方法 =====
  public toServerDTO(): SearchEngineServerDTO {
    return {
      id: this.id,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      name: this._name,
      description: this._description,
      indexPath: this._indexPath,
      indexedDocumentCount: this._indexedDocumentCount,
      totalDocumentCount: this._totalDocumentCount,
      lastIndexedAt: this._lastIndexedAt?.getTime() as TransferDate | null,
      isIndexing: this._isIndexing,
      indexProgress: this._indexProgress,
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
    };
  }

  public toClientDTO(): SearchEngineClientDTO {
    return {
      id: this.id,
      workspaceId: this._workspaceId,
      identityId: this._identityId,
      name: this._name,
      description: this._description,
      indexPath: this._indexPath,
      indexedDocumentCount: this._indexedDocumentCount,
      totalDocumentCount: this._totalDocumentCount,
      lastIndexedAt: this._lastIndexedAt?.getTime() as TransferDate | null,
      isIndexing: this._isIndexing,
      indexProgress: this._indexProgress,
      createdAt: this._createdAt.getTime() as TransferDate,
      updatedAt: this._updatedAt.getTime() as TransferDate,
      // UI 格式化字段
      formattedLastIndexed: this._lastIndexedAt?.toLocaleString() ?? null,
      formattedCreatedAt: this._createdAt.toLocaleString(),
      formattedUpdatedAt: this._updatedAt.toLocaleString(),
    };
  }

  public toPersistenceDTO(): SearchEnginePersistenceDTO {
    return {
      id: this.id,
      workspace_id: this._workspaceId,
      identityId: this._identityId,
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
