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

// Internal props type using domain-shared class types
interface RepositoryInternalProps {
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
}

export class Repository extends AggregateRoot<RepositoryId> implements RepositoryClient {
  private readonly _props: RepositoryInternalProps;

  private constructor(props: RepositoryInternalProps) {
    super(props.id);
    this._props = props;
  }

  // ================= Getters =================
  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get name(): string {
    return this._props.name;
  }

  get type(): RepositoryType {
    return this._props.type;
  }

  get path(): string | null {
    return this._props.path;
  }

  get description(): string | null {
    return this._props.description;
  }

  get config(): RepositoryConfig {
    return this._props.config;
  }

  get stats(): RepositoryStats {
    return this._props.stats;
  }

  get status(): RepositoryStatus {
    return this._props.status;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // ================= UI 计算属性 =================
  get isDeleted(): boolean {
    return this._props.status === 'Deleted';
  }

  get isArchived(): boolean {
    return this._props.status === 'Archived';
  }

  get isActive(): boolean {
    return this._props.status === 'Active';
  }

  get statusText(): string {
    const statusTextMap: Record<RepositoryStatus, string> = {
      Active: '活跃',
      Archived: '已归档',
      Deleted: '已删除',
    };
    return statusTextMap[this._props.status] ?? this._props.status;
  }

  get typeText(): string {
    const typeTextMap: Record<RepositoryType, string> = {
      Markdown: 'Markdown',
      Code: '代码',
      Mixed: '混合',
    };
    return typeTextMap[this._props.type] ?? this._props.type;
  }

  get folderCount(): number {
    return this._props.stats.folderCount;
  }

  get resourceCount(): number {
    return this._props.stats.resourceCount;
  }

  get totalSize(): number {
    return this._props.stats.totalSize;
  }

  get formattedSize(): string {
    return this._props.stats.formattedSize;
  }

  get createdAtText(): string {
    return this._props.createdAt.toLocaleString();
  }

  get updatedAtText(): string {
    return this._props.updatedAt.toLocaleString();
  }

  // ================= Factory Methods =================
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

  // ================= DTO Conversion =================
  public toDTO(): RepositoryClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._props.identityId),
      name: this._props.name,
      type: this._props.type,
      path: this._props.path,
      description: this._props.description,
      config: this._props.config.toDTO(),
      stats: this._props.stats.toDTO(),
      status: this._props.status,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
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
