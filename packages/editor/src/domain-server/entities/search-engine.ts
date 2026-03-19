/**
 * SearchEngine 实体实现
 */

import type { SearchEngineClientDTO, SearchEngineServerDTO } from '@dailyuse/contracts/editor';
import type {
  SearchEngineId,
  EditorWorkspaceId,
  IdentityId,
  TransferDate,
} from '@dailyuse/contracts/primitives';
import { Entity, generateUUID } from '@dailyuse/utils';

/**
 * SearchEngine 状态接口（domain types）
 */
export interface SearchEngineState {
  id: SearchEngineId;
  workspaceId: EditorWorkspaceId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  indexPath: string;
  indexedResourceCount: number;
  totalResourceCount: number;
  lastIndexedAt: Date | null;
  isIndexing: boolean;
  indexProgress: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SearchEngine 实体
 */
export class SearchEngine extends Entity<SearchEngineId> {
  // ===== 私有字段 =====
  private _props: SearchEngineState;

  // ===== 构造函数（私有） =====
  private constructor(state: SearchEngineState) {
    super(state.id);
    this._props = { ...state };
  }

  // ===== Getter 属性 =====
  public get workspaceId(): EditorWorkspaceId {
    return this._props.workspaceId;
  }

  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get name(): string {
    return this._props.name;
  }

  public get description(): string | null {
    return this._props.description;
  }

  public get indexPath(): string {
    return this._props.indexPath;
  }

  public get indexedResourceCount(): number {
    return this._props.indexedResourceCount;
  }

  public get totalResourceCount(): number {
    return this._props.totalResourceCount;
  }

  public get lastIndexedAt(): Date | null {
    return this._props.lastIndexedAt;
  }

  public get isIndexing(): boolean {
    return this._props.isIndexing;
  }

  public get indexProgress(): number | null {
    return this._props.indexProgress;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  // ===== 工厂方法 =====

  /**
   * 从状态恢复实体
   */
  public static load(state: SearchEngineState): SearchEngine {
    return new SearchEngine(state);
  }

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
      indexedResourceCount: 0,
      totalResourceCount: 0,
      lastIndexedAt: null,
      isIndexing: false,
      indexProgress: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 业务方法 =====
  public startIndexing(totalResourceCount: number): void {
    this._props.isIndexing = true;
    this._props.indexProgress = 0;
    this._props.totalResourceCount = totalResourceCount;
    this._props.updatedAt = new Date();
  }

  public updateIndexProgress(progress: number, indexedCount: number): void {
    if (!this._props.isIndexing) return;
    this._props.indexProgress = Math.min(100, Math.max(0, progress));
    this._props.indexedResourceCount = indexedCount;
    this._props.updatedAt = new Date();
  }

  public finishIndexing(): void {
    this._props.isIndexing = false;
    this._props.indexProgress = 100;
    this._props.lastIndexedAt = new Date();
    this._props.updatedAt = new Date();
  }

  public cancelIndexing(): void {
    this._props.isIndexing = false;
    this._props.indexProgress = null;
    this._props.updatedAt = new Date();
  }

  public rename(name: string): void {
    this._props.name = name;
    this._props.updatedAt = new Date();
  }

  public updateDescription(description: string | null): void {
    this._props.description = description;
    this._props.updatedAt = new Date();
  }

  // ===== 计算属性 =====
  public get indexPercentage(): number {
    return this._props.indexProgress ?? 0;
  }

  public get hasIndexedResources(): boolean {
    return this._props.indexedResourceCount > 0;
  }

  public get isFullyIndexed(): boolean {
    return (
      this._props.indexedResourceCount === this._props.totalResourceCount &&
      this._props.totalResourceCount > 0
    );
  }

  public get lastIndexedAtFormatted(): string | null {
    return this._props.lastIndexedAt?.toLocaleString() ?? null;
  }

  // ===== 序列化方法 =====
  public toServerDTO(): SearchEngineServerDTO {
    return {
      id: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      indexPath: this._props.indexPath,
      indexedResourceCount: this._props.indexedResourceCount,
      totalResourceCount: this._props.totalResourceCount,
      lastIndexedAt: this._props.lastIndexedAt?.getTime() as TransferDate | null,
      isIndexing: this._props.isIndexing,
      indexProgress: this._props.indexProgress,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
    };
  }

  public toClientDTO(): SearchEngineClientDTO {
    return {
      id: this.id,
      workspaceId: this._props.workspaceId,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      indexPath: this._props.indexPath,
      indexedResourceCount: this._props.indexedResourceCount,
      totalResourceCount: this._props.totalResourceCount,
      lastIndexedAt: this._props.lastIndexedAt?.getTime() as TransferDate | null,
      isIndexing: this._props.isIndexing,
      indexProgress: this._props.indexProgress,
      createdAt: this._props.createdAt.getTime() as TransferDate,
      updatedAt: this._props.updatedAt.getTime() as TransferDate,
      // UI 格式化字段
      formattedLastIndexed: this._props.lastIndexedAt?.toLocaleString() ?? null,
      formattedCreatedAt: this._props.createdAt.toLocaleString(),
      formattedUpdatedAt: this._props.updatedAt.toLocaleString(),
    };
  }
}
