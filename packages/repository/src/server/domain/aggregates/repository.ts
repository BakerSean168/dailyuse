/**
 * Repository 聚合根实现 (Server)
 *
 * DDD 聚合根职责：
 * - 管理仓储的元数据和配置
 * - 执行仓储业务逻辑
 * - 是事务边界
 */
import type {
  RepositoryServerDTO,
  RepositoryConfigDTO,
  RepositoryStatsDTO,
  RepositoryEventMap,
} from '@dailyuse/contracts/repository';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { RepositoryStatus, RepositoryType } from '@dailyuse/contracts/repository';
import { AggregateRoot } from '@dailyuse/utils/domain';
import { RepositoryId } from '../value-objects/repository-id';
import { RepositoryConfig } from '../value-objects/repository-config';
import { RepositoryStats } from '../value-objects/repository-stats';
import { BusinessRuleViolationError } from '@dailyuse/utils/errors';

/**
 * 创建仓库参数
 */
export interface CreateRepositoryParams {
  identityId: IdentityId;
  name: string;
  type: RepositoryType;
  path?: string | null;
  description?: string | null;
  config?: Partial<RepositoryConfigDTO>;
}

/** Domain state interface for Repository */
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
  createdAt: Date;
  updatedAt: Date;
  version: number;
  deletedAt: Date | null;
}

export class Repository extends AggregateRoot<RepositoryId> {
  // ===== 私有属性容器 =====
  private _props: RepositoryState;

  // ===== 私有构造函数 =====
  private constructor(state: RepositoryState) {
    super(state.id);
    this._props = state;
  }

  // ===== Getters =====
  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get name(): string {
    return this._props.name;
  }

  public get type(): RepositoryType {
    return this._props.type;
  }

  public get path(): string | null {
    return this._props.path;
  }

  public get description(): string | null {
    return this._props.description;
  }

  public get config(): RepositoryConfigDTO {
    return this._props.config.toDTO();
  }

  public get stats(): RepositoryStatsDTO {
    return this._props.stats.toDTO();
  }

  public get status(): RepositoryStatus {
    return this._props.status;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  public get updatedAt(): Date {
    return this._props.updatedAt;
  }

  public get version(): number {
    return this._props.version;
  }

  public get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // ===== 业务方法 =====

  public updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new BusinessRuleViolationError('Repository name cannot be empty.');
    }
    this._props.name = name;
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:updated']>('repository:updated', {
      repositoryId: this.id as RepositoryId,
      changedFields: ['name'],
    });
  }

  public updateDescription(description: string | null): void {
    this._props.description = description;
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:updated']>('repository:updated', {
      repositoryId: this.id as RepositoryId,
      changedFields: ['description'],
    });
  }

  public updatePath(path: string | null): void {
    this._props.path = path;
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:updated']>('repository:updated', {
      repositoryId: this.id as RepositoryId,
      changedFields: ['path'],
    });
  }

  public updateConfig(config: Partial<RepositoryConfigDTO>): void {
    const currentConfig = this._props.config.toDTO();
    this._props.config = RepositoryConfig.fromDTO({ ...currentConfig, ...config });
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:updated']>('repository:updated', {
      repositoryId: this.id as RepositoryId,
      changedFields: ['config'],
    });
  }

  public updateStats(stats: Partial<RepositoryStatsDTO>): void {
    const currentStats = this._props.stats.toDTO();
    this._props.stats = RepositoryStats.fromDTO({ ...currentStats, ...stats });
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:statistics-updated']>(
      'repository:statistics-updated',
      {
        identityId: this._props.identityId,
        totalRepositories: 1,
        totalResources: this._props.stats.resourceCount,
      },
    );
  }

  public recordResourceAdded(sizeBytes: number = 0): void {
    this._props.stats = this._props.stats.incrementResources().addSize(sizeBytes);
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:statistics-updated']>(
      'repository:statistics-updated',
      {
        identityId: this._props.identityId,
        totalRepositories: 1,
        totalResources: this._props.stats.resourceCount,
      },
    );
  }

  public recordResourceRemoved(sizeBytes: number = 0): void {
    const current = this._props.stats.toDTO();
    this._props.stats = RepositoryStats.fromDTO({
      resourceCount: Math.max(0, current.resourceCount - 1),
      folderCount: current.folderCount,
      totalSize: Math.max(0, current.totalSize - sizeBytes),
    });
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:statistics-updated']>(
      'repository:statistics-updated',
      {
        identityId: this._props.identityId,
        totalRepositories: 1,
        totalResources: this._props.stats.resourceCount,
      },
    );
  }

  public recordFolderAdded(): void {
    this._props.stats = this._props.stats.incrementFolders();
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:statistics-updated']>(
      'repository:statistics-updated',
      {
        identityId: this._props.identityId,
        totalRepositories: 1,
        totalResources: this._props.stats.resourceCount,
      },
    );
  }

  public recordFolderRemoved(): void {
    const current = this._props.stats.toDTO();
    this._props.stats = RepositoryStats.fromDTO({
      resourceCount: current.resourceCount,
      folderCount: Math.max(0, current.folderCount - 1),
      totalSize: current.totalSize,
    });
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:statistics-updated']>(
      'repository:statistics-updated',
      {
        identityId: this._props.identityId,
        totalRepositories: 1,
        totalResources: this._props.stats.resourceCount,
      },
    );
  }

  public archive(): void {
    if (this._props.status === RepositoryStatus.Archived) {
      throw new Error('仓库已归档');
    }
    this._props.status = RepositoryStatus.Archived;
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:archived']>('repository:archived', {
      repositoryId: this.id as RepositoryId,
    });
  }

  public unarchive(): void {
    if (this._props.status !== RepositoryStatus.Archived) {
      throw new Error('仓库未归档');
    }
    this._props.status = RepositoryStatus.Active;
    this._props.updatedAt = new Date();
  }

  public delete(): void {
    this._props.status = RepositoryStatus.Deleted;
    this._props.updatedAt = new Date();

    this.addDomainEvent<RepositoryEventMap['repository:deleted']>('repository:deleted', {
      repositoryId: this.id as RepositoryId,
    });
  }

  public isActive(): boolean {
    return this._props.status === RepositoryStatus.Active;
  }

  public isArchived(): boolean {
    return this._props.status === RepositoryStatus.Archived;
  }

  public isDeleted(): boolean {
    return this._props.status === RepositoryStatus.Deleted;
  }

  // ===== DTO 转换 =====

  public toServerDTO(): RepositoryServerDTO {
    return {
      id: this.id as RepositoryId,
      identityId: this._props.identityId as IdentityId,
      name: this._props.name,
      type: this._props.type,
      path: this._props.path,
      description: this._props.description,
      config: this._props.config.toDTO(),
      stats: this._props.stats.toDTO(),
      status: this._props.status,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      version: this._props.version,
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
    };
  }

  public toClientDTO(): import('@dailyuse/contracts/repository').RepositoryClientDTO {
    const isDeleted = this._props.status === RepositoryStatus.Deleted;
    const isArchived = this._props.status === RepositoryStatus.Archived;
    const isActive = this._props.status === RepositoryStatus.Active;

    return {
      id: this.id as import('@dailyuse/contracts/repository').RepositoryClientDTO['id'],
      identityId: this._props.identityId as import('@dailyuse/contracts/repository').RepositoryClientDTO['identityId'],
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
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
      isDeleted,
      isArchived,
      isActive,
      folderCount: this._props.stats.folderCount,
      resourceCount: this._props.stats.resourceCount,
      totalSize: this._props.stats.totalSize,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: CreateRepositoryParams): Repository {
    if (!params.name || params.name.trim().length === 0) {
      throw new BusinessRuleViolationError('Repository name cannot be empty.');
    }

    const id = RepositoryId.of(RepositoryId.generate());
    const now = new Date();

    const config = params.config
      ? RepositoryConfig.create({
          searchEngine: params.config.searchEngine ?? 'postgres',
          enableGit: params.config.enableGit ?? false,
          autoSync: params.config.autoSync,
          syncInterval: params.config.syncInterval,
        })
      : RepositoryConfig.createDefault();

    const repository = new Repository({
      id,
      identityId: params.identityId,
      name: params.name,
      type: params.type,
      path: params.path ?? null,
      description: params.description ?? null,
      config,
      stats: RepositoryStats.createEmpty(),
      status: RepositoryStatus.Active,
      createdAt: now,
      updatedAt: now,
      version: 1,
      deletedAt: null,
    });

    repository.addDomainEvent<RepositoryEventMap['repository:created']>('repository:created', {
      identityId: params.identityId,
      name: params.name,
      path: params.path ?? '',
    });

    return repository;
  }

  public static load(state: RepositoryState): Repository {
    return new Repository(state);
  }
}
