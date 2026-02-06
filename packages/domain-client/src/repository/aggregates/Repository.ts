/**
 * Repository Aggregate Root - Domain Client
 * 仓储聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 RepositoryClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: RepositoryClientDTO): Repository
 * - Instance toDTO(): RepositoryClientDTO
 */

import type {
  RepositoryClient,
  RepositoryClientDTO,
  RepositoryConfigDTO,
  RepositoryStatsDTO,
} from '@dailyuse/contracts/repository';
import type { RepositoryType, RepositoryStatus } from '@dailyuse/contracts/repository';
import { AggregateRoot } from '@dailyuse/utils';
import {
  RepositoryId,
  RepositoryConfig,
  RepositoryStats,
} from '@dailyuse/domain-shared/repository';
import { IdentityId } from '@dailyuse/domain-shared';

export class Repository extends AggregateRoot<RepositoryId> implements RepositoryClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _name: string;
  private _type: RepositoryType;
  private _path: string | null;
  private _description: string | null;
  private _config: RepositoryConfig;
  private _stats: RepositoryStats;
  private _status: RepositoryStatus;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: RepositoryId;
    identityId: IdentityId;
    name: string;
    type: RepositoryType;
    path: string | null;
    description: string | null;
    config: RepositoryConfig;
    stats: RepositoryStats;
    status: RepositoryStatus;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._description = params.description;
    this._config = params.config;
    this._stats = params.stats;
    this._status = params.status;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get name(): string {
    return this._name;
  }

  get type(): RepositoryType {
    return this._type;
  }

  get path(): string | null {
    return this._path;
  }

  get description(): string | null {
    return this._description;
  }

  get config(): RepositoryConfig {
    return this._config;
  }

  get stats(): RepositoryStats {
    return this._stats;
  }

  get status(): RepositoryStatus {
    return this._status;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ================= UI 计算属性 =================
  get isDeleted(): boolean {
    return this._status === 'Deleted';
  }

  get isArchived(): boolean {
    return this._status === 'Archived';
  }

  get isActive(): boolean {
    return this._status === 'Active';
  }

  get statusText(): string {
    const statusTextMap: Record<RepositoryStatus, string> = {
      Active: '活跃',
      Archived: '已归档',
      Deleted: '已删除',
    };
    return statusTextMap[this._status] ?? this._status;
  }

  get typeText(): string {
    const typeTextMap: Record<RepositoryType, string> = {
      Markdown: 'Markdown',
      Code: '代码',
      Mixed: '混合',
    };
    return typeTextMap[this._type] ?? this._type;
  }

  get folderCount(): number {
    return this._stats.folderCount;
  }

  get resourceCount(): number {
    return this._stats.resourceCount;
  }

  get totalSize(): number {
    return this._stats.totalSize;
  }

  get formattedSize(): string {
    return this._stats.formattedSize;
  }

  get createdAtText(): string {
    return this._createdAt.toLocaleString();
  }

  get updatedAtText(): string {
    return this._updatedAt.toLocaleString();
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: RepositoryClientDTO): Repository {
    return new Repository({
      id: RepositoryId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description,
      config: RepositoryConfig.fromDTO(dto.config),
      stats: RepositoryStats.fromDTO(dto.stats),
      status: dto.status,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): RepositoryClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: this._config.toDTO(),
      stats: this._stats.toDTO(),
      status: this._status,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      // UI 计算字段
      isDeleted: this.isDeleted,
      isArchived: this.isArchived,
      isActive: this.isActive,
      statusText: this.statusText,
      typeText: this.typeText,
      folderCount: this.folderCount,
      resourceCount: this.resourceCount,
      totalSize: this.totalSize,
      formattedSize: this.formattedSize,
      createdAtText: this.createdAtText,
      updatedAtText: this.updatedAtText,
    };
  }
}
