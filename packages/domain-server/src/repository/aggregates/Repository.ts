/**
 * Repository 聚合根实现 (Server)
 *
 * DDD 聚合根职责：
 * - 管理仓储的元数据和配置
 * - 管理文件夹树结构（子实体）
 * - 执行仓储业务逻辑
 * - 是事务边界
 */
import type {
  FolderServer,
  RepositoryClientDTO,
  RepositoryConfigServerDTO,
  RepositoryPersistenceDTO,
  RepositoryServer,
  RepositoryServerDTO,
  RepositoryStatsServerDTO,
} from '@dailyuse/contracts/repository';
import { RepositoryStatus, RepositoryType } from '@dailyuse/contracts/repository';
import { AggregateRoot } from '@dailyuse/utils';
import { RepositoryConfig, RepositoryStats } from '../value-objects';

/**
 * 创建仓库 DTO
 */
export interface CreateRepositoryDTO {
  accountUuid: string;
  name: string;
  type: RepositoryType;
  path: string;
  description?: string;
  config?: Partial<RepositoryConfigServerDTO>;
}

export class Repository extends AggregateRoot implements RepositoryServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _type: RepositoryType;
  private _path: string;
  private _description: string | null;
  private _config: RepositoryConfig;
  private _stats: RepositoryStats;
  private _status: RepositoryStatus;
  private _createdAt: number;
  private _updatedAt: number;
  private _folders: FolderServer[] | null;

  // ===== 私有构造函数 =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string | null;
    config: RepositoryConfig;
    stats: RepositoryStats;
    status: RepositoryStatus;
    createdAt: number;
    updatedAt: number;
    folders?: FolderServer[] | null;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._description = params.description ?? null;
    this._config = params.config;
    this._stats = params.stats;
    this._status = params.status;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._folders = params.folders ?? null;
  }

  // ===== Getters =====
  public override get uuid(): string {
    return this._uuid;
  }

  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get name(): string {
    return this._name;
  }

  public get type(): RepositoryType {
    return this._type;
  }

  public get path(): string {
    return this._path;
  }

  public get description(): string | null {
    return this._description;
  }

  public get config(): RepositoryConfig {
    return this._config;
  }

  public get stats(): RepositoryStats {
    return this._stats;
  }

  public get status(): RepositoryStatus {
    return this._status;
  }

  public get createdAt(): number {
    return this._createdAt;
  }

  public get updatedAt(): number {
    return this._updatedAt;
  }

  public get folders(): FolderServer[] | null {
    return this._folders;
  }

  // ===== 业务方法 =====
  updateConfig(newConfig: Partial<RepositoryConfigServerDTO>): void {
    const currentDTO = this._config.toServerDTO();
    const merged = { ...currentDTO, ...newConfig };
    this._config = RepositoryConfig.fromServerDTO(merged);
    this._updatedAt = Date.now();
  }

  updateStats(newStats: Partial<RepositoryStatsServerDTO>): void {
    const currentDTO = this._stats.toServerDTO();
    const merged = { ...currentDTO, ...newStats };
    this._stats = RepositoryStats.fromServerDTO(merged);
    this._updatedAt = Date.now();
  }

  archive(): void {
    if (this._status === RepositoryStatus.ARCHIVED) {
      throw new Error('Repository is already archived');
    }
    this._status = RepositoryStatus.ARCHIVED;
    this._updatedAt = Date.now();
  }

  activate(): void {
    if (this._status === RepositoryStatus.ACTIVE) {
      throw new Error('Repository is already active');
    }
    this._status = RepositoryStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  delete(): void {
    this._status = RepositoryStatus.DELETED;
    this._updatedAt = Date.now();
  }

  /**
   * 检查仓库是否属于指定账户
   */
  isOwnedBy(accountUuid: string): boolean {
    return this._accountUuid === accountUuid;
  }

  /**
   * 记录访问时间
   */
  recordAccess(): void {
    this._updatedAt = Date.now();
    // 可以在这里增加访问计数等
  }

  /**
   * 更新仓库名称
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Repository name cannot be empty');
    }
    this._name = name.trim();
    this._updatedAt = Date.now();
  }

  /**
   * 更新仓库描述
   */
  updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = Date.now();
  }

  /**
   * 更新仓库路径
   */
  updatePath(path: string): void {
    if (!path || path.trim().length === 0) {
      throw new Error('Repository path cannot be empty');
    }
    this._path = path.trim();
    this._updatedAt = Date.now();
  }

  /**
   * 添加关联目标
   * 注意：这个方法可能需要在配置中添加 relatedGoals 字段
   */
  addRelatedGoal(goalUuid: string): void {
    // 暂时只更新时间戳，实际实现需要在 config 中添加 relatedGoals 字段
    this._updatedAt = Date.now();
    // TODO: 在 RepositoryConfig 中添加 relatedGoals 支持
  }

  /**
   * 检查用户是否可以执行指定操作
   */
  canPerformOperation(accountUuid: string, _operation: string): boolean {
    // 基本实现：只有所有者可以执行操作
    return this.isOwnedBy(accountUuid);
  }

  // ===== DTO 转换方法 =====
  toServerDTO(includeFolders = false): RepositoryServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: this._config.toServerDTO(),
      stats: this._stats.toServerDTO(),
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      folders: includeFolders ? this._folders?.map((f) => (f as any).toServerDTO()) || null : null,
    };
  }

  toClientDTO(includeFolders = false): RepositoryClientDTO {
    // 状态判断
    const isDeleted = this._status === RepositoryStatus.DELETED;
    const isArchived = this._status === RepositoryStatus.ARCHIVED;
    const isActive = this._status === RepositoryStatus.ACTIVE;

    // 状态文本
    const statusText = isDeleted ? 'Deleted' : isArchived ? 'Archived' : 'Active';

    // 类型文本
    const typeText =
      this._type === 'MARKDOWN' ? 'Markdown' : this._type === 'CODE' ? 'Code' : 'Mixed';

    // 统计数据
    const statsDTO = this._stats.toServerDTO();
    const folderCount = statsDTO.folderCount || 0;
    const resourceCount = statsDTO.resourceCount || 0;
    const totalSize = statsDTO.totalSize || 0;

    // 文件大小格式化
    const formatSize = (bytes: number): string => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    // 时间格式化
    const formattedCreatedAt = new Date(this._createdAt).toLocaleString();
    const formattedUpdatedAt = new Date(this._updatedAt).toLocaleString();

    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: this._config.toServerDTO() as any, // TODO: 待 config 实现 toClientDTO
      stats: statsDTO as any, // TODO: 待 stats 实现 toClientDTO
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      folders: includeFolders
        ? this._folders?.map((f) => (f as any).toClientDTO?.(true)) || null
        : null,

      // UI 计算字段
      isDeleted,
      isArchived,
      isActive,
      statusText,
      typeText,
      folderCount,
      resourceCount,
      totalSize,
      formattedSize: formatSize(totalSize),
      createdAtText: formattedCreatedAt,
      updatedAtText: formattedUpdatedAt,
    };
  }

  toPersistenceDTO(): RepositoryPersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      description: this._description,
      config: JSON.stringify(this._config.toServerDTO()),
      stats: JSON.stringify(this._stats.toServerDTO()),
      status: this._status,
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
    };
  }

  // ===== 静态工厂方法 =====
  public static create(params: {
    accountUuid: string;
    name: string;
    type: RepositoryType;
    path: string;
    description?: string;
    config?: Partial<RepositoryConfigServerDTO>;
  }): Repository {
    const config = RepositoryConfig.create(params.config);
    const stats = RepositoryStats.create();
    const now = Date.now();

    return new Repository({
      accountUuid: params.accountUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      description: params.description ?? null,
      config,
      stats,
      status: RepositoryStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      folders: null,
    });
  }

  public static fromServerDTO(dto: RepositoryServerDTO): Repository {
    const folders = dto.folders
      ? dto.folders.map((f) => {
          // TODO: Import Folder class when available
          return null as any;
        })
      : null;

    return new Repository({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description ?? null,
      config: RepositoryConfig.fromServerDTO(dto.config),
      stats: RepositoryStats.fromServerDTO(dto.stats),
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      folders,
    });
  }

  public static fromPersistenceDTO(dto: RepositoryPersistenceDTO): Repository {
    return new Repository({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      description: dto.description ?? null,
      config: RepositoryConfig.fromServerDTO(JSON.parse(dto.config)),
      stats: RepositoryStats.fromServerDTO(JSON.parse(dto.stats)),
      status: dto.status,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
      folders: null,
    });
  }
}
