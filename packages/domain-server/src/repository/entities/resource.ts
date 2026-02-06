/**
 * Resource Entity - Server Implementation
 * 资源实体 - 服务端实现
 */
import type {
  ResourcePersistenceDTO,
  ResourceServer,
  ResourceServerDTO,
  ResourceMetadataDTO,
  ResourceStatsDTO,
  ExternalLink,
} from '@dailyuse/contracts/repository';
import type { ResourceId, RepositoryId, FolderId } from '@dailyuse/contracts/primitives';
import { ResourceStatus, ResourceType } from '@dailyuse/contracts/repository';
import { Entity } from '@dailyuse/utils';
import { ResourceId as ResourceIdType } from '@dailyuse/domain-shared/repository';
import { ResourceMetadata, ResourceStats } from '../value-objects';

export class Resource extends Entity<ResourceId> implements ResourceServer {
  // ===== 私有字段 =====
  private _repositoryId: RepositoryId;
  private _folderId: FolderId | null;
  private _type: ResourceType;
  private _name: string;
  private _path: string;
  private _mimeType: string | null;
  private _size: number | null;
  private _content: string | null;
  private _childrenCount: number | null;
  private _metadata: ResourceMetadata;
  private _stats: ResourceStats;
  private _status: ResourceStatus;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _version: number;
  private _deletedAt: Date | null;
  private _externalLinks: ExternalLink[] | null;

  // ===== 构造函数（私有） =====
  private constructor(
    id: ResourceId,
    params: {
      repositoryId: RepositoryId;
      folderId: FolderId | null;
      type: ResourceType;
      name: string;
      path: string;
      mimeType: string | null;
      size: number | null;
      content: string | null;
      childrenCount: number | null;
      metadata: ResourceMetadata;
      stats: ResourceStats;
      status: ResourceStatus;
      createdAt: Date;
      updatedAt: Date;
      version: number;
      deletedAt?: Date | null;
      externalLinks?: ExternalLink[] | null;
    },
  ) {
    super(id);
    this._repositoryId = params.repositoryId;
    this._folderId = params.folderId;
    this._type = params.type;
    this._name = params.name;
    this._path = params.path;
    this._mimeType = params.mimeType;
    this._size = params.size;
    this._content = params.content;
    this._childrenCount = params.childrenCount;
    this._metadata = params.metadata;
    this._stats = params.stats;
    this._status = params.status;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._version = params.version;
    this._deletedAt = params.deletedAt ?? null;
    this._externalLinks = params.externalLinks ?? null;
  }

  // ===== Getters =====
  get repositoryId(): RepositoryId {
    return this._repositoryId;
  }

  get folderId(): FolderId | null {
    return this._folderId;
  }

  get type(): ResourceType {
    return this._type;
  }

  get name(): string {
    return this._name;
  }

  get path(): string {
    return this._path;
  }

  get mimeType(): string | null {
    return this._mimeType;
  }

  get size(): number | null {
    return this._size;
  }

  get content(): string | null {
    return this._content;
  }

  get childrenCount(): number | null {
    return this._childrenCount;
  }

  get metadata(): ResourceMetadataDTO {
    return this._metadata.toDTO();
  }

  get stats(): ResourceStatsDTO {
    return this._stats.toDTO();
  }

  get status(): ResourceStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get version(): number {
    return this._version;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // ===== 业务方法 =====

  public rename(newName: string): void {
    this._name = newName;
    this._updatedAt = new Date();
    this._version++;
  }

  public updateContent(content: string): void {
    this._content = content;
    this._updatedAt = new Date();
    this._version++;
    // Update stats
    this._stats = this._stats.recordEdit();
  }

  public moveTo(folderId: FolderId | null, newPath: string): void {
    this._folderId = folderId;
    this._path = newPath;
    this._updatedAt = new Date();
    this._version++;
  }

  public archive(): void {
    if (this._status === ResourceStatus.Archived) {
      throw new Error('资源已归档');
    }
    this._status = ResourceStatus.Archived;
    this._updatedAt = new Date();
    this._version++;
  }

  public unarchive(): void {
    if (this._status !== ResourceStatus.Archived) {
      throw new Error('资源未归档');
    }
    this._status = ResourceStatus.Active;
    this._updatedAt = new Date();
    this._version++;
  }

  public delete(): void {
    this._status = ResourceStatus.Deleted;
    this._updatedAt = new Date();
    this._version++;
  }

  public recordView(): void {
    this._stats = this._stats.recordView();
    this._updatedAt = new Date();
  }

  public isActive(): boolean {
    return this._status === ResourceStatus.Active;
  }

  public isArchived(): boolean {
    return this._status === ResourceStatus.Archived;
  }

  public isDeleted(): boolean {
    return this._status === ResourceStatus.Deleted;
  }

  public isFolder(): boolean {
    return this._type === ResourceType.FOLDER;
  }

  public isFile(): boolean {
    return this._type === ResourceType.FILE;
  }

  // ===== DTO 转换 =====

  public toServerDTO(): ResourceServerDTO {
    return {
      id: String(this.id),
      repositoryId: String(this._repositoryId),
      folderId: this._folderId ? String(this._folderId) : null,
      name: this._name,
      type: this._type,
      path: this._path,
      mimeType: this._mimeType,
      size: this._size,
      content: this._content,
      childrenCount: this._childrenCount,
      metadata: this._metadata.toDTO(),
      stats: this._stats.toDTO(),
      status: this._status,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      version: this._version,
      deletedAt: this._deletedAt ? this._deletedAt.getTime() : null,
      externalLinks: this._externalLinks,
    };
  }

  public toPersistenceDTO(): ResourcePersistenceDTO {
    return {
      id: String(this.id),
      repositoryId: String(this._repositoryId),
      folderId: this._folderId ? String(this._folderId) : null,
      name: this._name,
      type: this._type,
      path: this._path,
      mimeType: this._mimeType,
      size: this._size,
      content: this._content,
      metadata: JSON.stringify(this._metadata.toDTO()),
      stats: JSON.stringify(this._stats.toDTO()),
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      version: this._version,
      deletedAt: this._deletedAt,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: {
    repositoryId: RepositoryId;
    folderId?: FolderId | null;
    name: string;
    type: ResourceType;
    path: string;
    mimeType?: string | null;
    size?: number | null;
    content?: string | null;
    metadata?: Partial<ResourceMetadataDTO>;
  }): Resource {
    const id = ResourceIdType.of(ResourceIdType.generate());
    const now = new Date();

    return new Resource(id, {
      repositoryId: params.repositoryId,
      folderId: params.folderId ?? null,
      type: params.type,
      name: params.name,
      path: params.path,
      mimeType: params.mimeType ?? null,
      size: params.size ?? null,
      content: params.content ?? null,
      childrenCount: params.type === ResourceType.FOLDER ? 0 : null,
      metadata: params.metadata 
        ? ResourceMetadata.create({
            tags: params.metadata.tags ?? [],
            wordCount: params.metadata.wordCount ?? null,
            readingTime: params.metadata.readingTime ?? null,
            thumbnail: params.metadata.thumbnail ?? null,
          })
        : ResourceMetadata.createEmpty(),
      stats: ResourceStats.createEmpty(),
      status: ResourceStatus.Active,
      createdAt: now,
      updatedAt: now,
      version: 1,
      deletedAt: null,
      externalLinks: null,
    });
  }

  public static fromServerDTO(dto: ResourceServerDTO): Resource {
    const id = ResourceIdType.of(dto.id);

    return new Resource(id, {
      repositoryId: dto.repositoryId as RepositoryId,
      folderId: dto.folderId as FolderId | null,
      type: dto.type,
      name: dto.name,
      path: dto.path,
      mimeType: dto.mimeType,
      size: dto.size,
      content: dto.content,
      childrenCount: dto.childrenCount,
      metadata: ResourceMetadata.fromDTO(dto.metadata),
      stats: ResourceStats.fromDTO(dto.stats),
      status: dto.status,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      version: dto.version,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      externalLinks: dto.externalLinks,
    });
  }

  public static fromPersistenceDTO(dto: ResourcePersistenceDTO): Resource {
    const id = ResourceIdType.of(dto.id);

    return new Resource(id, {
      repositoryId: dto.repositoryId as RepositoryId,
      folderId: dto.folderId as FolderId | null,
      type: dto.type,
      name: dto.name,
      path: dto.path,
      mimeType: dto.mimeType,
      size: dto.size,
      content: dto.content,
      childrenCount: null,
      metadata: ResourceMetadata.fromDTO(JSON.parse(dto.metadata)),
      stats: ResourceStats.fromDTO(JSON.parse(dto.stats)),
      status: dto.status,
      createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt),
      updatedAt: dto.updatedAt instanceof Date ? dto.updatedAt : new Date(dto.updatedAt),
      version: dto.version,
      deletedAt: dto.deletedAt ? (dto.deletedAt instanceof Date ? dto.deletedAt : new Date(dto.deletedAt)) : null,
      externalLinks: null,
    });
  }
}
