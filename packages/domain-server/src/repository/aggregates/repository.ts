/**
 * Repository 聚合根实现 (Server)
 *
 * DDD 聚合根职责：
 * - 管理仓储的元数据和配置
 * - 执行仓储业务逻辑
 * - 是事务边界
 */
import type {
  RepositoryPersistenceDTO,
  RepositoryServer,
  RepositoryServerDTO,
  RepositoryConfigDTO,
  RepositoryStatsDTO,
} from '@dailyuse/contracts/repository';
import type { IdentityId } from '@dailyuse/contracts/primitives';
import { RepositoryStatus, RepositoryType } from '@dailyuse/contracts/repository';
import { AggregateRoot } from '@dailyuse/utils';
import {
  RepositoryId,
  RepositoryConfig,
  RepositoryStats,
} from '@dailyuse/domain-shared/repository';
import { IdentityId as IdentityIdType } from '@dailyuse/domain-shared/shared';

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

export class Repository
  extends AggregateRoot<RepositoryId>
  implements RepositoryServer
{
  // ===== 私有字段 =====
  private _identityId: IdentityId;
  private _name: string;
  private _type: RepositoryType;
  private _path: string | null;
  private _description: string | null;
  private _config: RepositoryConfig;
  private _stats: RepositoryStats;
  private _status: RepositoryStatus;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _version: number;
  private _deletedAt: Date | null;

  // ===== 私有构造函数 =====
  private constructor(
    id: RepositoryId,
    params: {
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
    },
  ) {
    super(id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._description = params.description;
    this._config = params.config;
    this._stats = params.stats;
    this._status = params.status;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._version = params.version;
    this._deletedAt = params.deletedAt;
  }

  // ===== Getters =====
  public get identityId(): IdentityId {
    return this._identityId;
  }

  public get name(): string {
    return this._name;
  }

  public get type(): RepositoryType {
    return this._type;
  }

  public get path(): string | null {
    return this._path;
  }

  public get description(): string | null {
    return this._description;
  }

  public get config(): RepositoryConfigDTO {
    return this._config.toDTO();
  }

  public get stats(): RepositoryStatsDTO {
    return this._stats.toDTO();
  }

  public get status(): RepositoryStatus {
    return this._status;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public get version(): number {
    return this._version;
  }

  public get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ===== 业务方法 =====

  public updateName(name: string): void {
    this._name = name;
    this._updatedAt = new Date();
  }

  public updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = new Date();
  }

  public updatePath(path: string | null): void {
    this._path = path;
    this._updatedAt = new Date();
  }

  public updateConfig(config: Partial<RepositoryConfigDTO>): void {
    const currentConfig = this._config.toDTO();
    this._config = RepositoryConfig.fromDTO({ ...currentConfig, ...config });
    this._updatedAt = new Date();
  }

  public archive(): void {
    if (this._status === RepositoryStatus.Archived) {
      throw new Error('仓库已归档');
    }
    this._status = RepositoryStatus.Archived;
    this._updatedAt = new Date();
  }

  public unarchive(): void {
    if (this._status !== RepositoryStatus.Archived) {
      throw new Error('仓库未归档');
    }
    this._status = RepositoryStatus.Active;
    this._updatedAt = new Date();
  }

  public delete(): void {
    this._status = RepositoryStatus.Deleted;
    this._updatedAt = new Date();
  }

  public isActive(): boolean {
    return this._status === RepositoryStatus.Active;
  }

  public isArchived(): boolean {
    return this._status === RepositoryStatus.Archived;
  }

  public isDeleted(): boolean {
    return this._status === RepositoryStatus.Deleted;
  }

  // ===== DTO 转换 =====

  public toServerDTO(): RepositoryServerDTO {
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
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      version: this._version,
      deletedAt: this._deletedAt ? this._deletedAt.getTime() : null,
    };
  }

  public toPersistenceDTO(): RepositoryPersistenceDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: JSON.stringify(this._config.toDTO()),
      stats: JSON.stringify(this._stats.toDTO()),
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      version: this._version,
      deletedAt: this._deletedAt,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: CreateRepositoryParams): Repository {
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

    return new Repository(id, {
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
  }

  public static fromServerDTO(dto: RepositoryServerDTO): Repository {
    const id = RepositoryId.of(dto.id);

    return new Repository(id, {
      identityId: IdentityIdType.of(dto.identityId),
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description,
      config: RepositoryConfig.fromDTO(dto.config),
      stats: RepositoryStats.fromDTO(dto.stats),
      status: dto.status,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      version: dto.version,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  public static fromPersistenceDTO(dto: RepositoryPersistenceDTO): Repository {
    const id = RepositoryId.of(dto.id);

    return new Repository(id, {
      identityId: IdentityIdType.of(dto.identityId),
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description,
      config: RepositoryConfig.fromDTO(JSON.parse(dto.config)),
      stats: RepositoryStats.fromDTO(JSON.parse(dto.stats)),
      status: dto.status,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      version: dto.version,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }
}
