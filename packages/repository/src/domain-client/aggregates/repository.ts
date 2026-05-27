/**
 * Repository Aggregate Root - Domain Client
 * 仓储聚合根 - 领域客户端
 *
 * 【规范说明】
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static load(state: RepositoryState): Repository
 * - Instance toDTO(): RepositoryClientDTO
 */

import type { RepositoryClientDTO } from '@dailyuse/contracts/repository';
import type { RepositoryType, RepositoryStatus } from '@dailyuse/contracts/repository';
import { AggregateRoot } from '@dailyuse/utils/domain';
import { RepositoryId } from '../../domain-shared/value-objects/repository-id';
import { RepositoryConfig } from '../../domain-shared/value-objects/repository-config';
import { RepositoryStats } from '../../domain-shared/value-objects/repository-stats';
import { IdentityId } from '@dailyuse/domain-shared';

export interface RepositoryState {
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

export class Repository extends AggregateRoot<RepositoryId> {
  private readonly _props: RepositoryState;

  private constructor(props: RepositoryState) {
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

  get folderCount(): number {
    return this._props.stats.folderCount;
  }

  get resourceCount(): number {
    return this._props.stats.resourceCount;
  }

  get totalSize(): number {
    return this._props.stats.totalSize;
  }

  // ================= Factory Methods =================
  public static load(state: RepositoryState): Repository {
    return new Repository(state);
  }

  // ================= DTO Conversion =================
  public toDTO(): RepositoryClientDTO {
    return {
      id: String(this.id) as RepositoryClientDTO['id'],
      identityId: String(this._props.identityId) as RepositoryClientDTO['identityId'],
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
      folderCount: this.folderCount,
      resourceCount: this.resourceCount,
      totalSize: this.totalSize,
    };
  }
}
