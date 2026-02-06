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

/** Props interface for Repository */
interface RepositoryProps {
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

export class Repository
  extends AggregateRoot<RepositoryId>
  implements RepositoryServer
{
  // ===== 私有属性容器 =====
  private _props: RepositoryProps;

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
    this._props = {
      identityId: params.identityId,
      name: params.name,
      type: params.type,
      path: params.path,
      description: params.description,
      config: params.config,
      stats: params.stats,
      status: params.status,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      version: params.version,
      deletedAt: params.deletedAt,
    };
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
    this._props.name = name;
    this._props.updatedAt = new Date();
  }

  public updateDescription(description: string | null): void {
    this._props.description = description;
    this._props.updatedAt = new Date();
  }

  public updatePath(path: string | null): void {
    this._props.path = path;
    this._props.updatedAt = new Date();
  }

  public updateConfig(config: Partial<RepositoryConfigDTO>): void {
    const currentConfig = this._props.config.toDTO();
    this._props.config = RepositoryConfig.fromDTO({ ...currentConfig, ...config });
    this._props.updatedAt = new Date();
  }

  public archive(): void {
    if (this._props.status === RepositoryStatus.Archived) {
      throw new Error('仓库已归档');
    }
    this._props.status = RepositoryStatus.Archived;
    this._props.updatedAt = new Date();
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
      id: String(this.id),
      identityId: String(this._props.identityId),
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

  public toPersistenceDTO(): RepositoryPersistenceDTO {
    return {
      id: String(this.id),
      identityId: String(this._props.identityId),
      name: this._props.name,
      type: this._props.type,
      path: this._props.path,
      description: this._props.description,
      config: JSON.stringify(this._props.config.toDTO()),
      stats: JSON.stringify(this._props.stats.toDTO()),
      status: this._props.status,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      version: this._props.version,
      deletedAt: this._props.deletedAt,
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
