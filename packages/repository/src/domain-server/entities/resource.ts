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
import { ResourceId as ResourceIdType, RepositoryId as RepositoryIdType } from '@/domain-shared';
import { ResourceMetadata, ResourceStats } from '../value-objects';

/** 内部状态接口 for Resource */
interface ResourceState {
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
  deletedAt: Date | null;
  externalLinks: ExternalLink[] | null;
}

export class Resource extends Entity<ResourceId> implements ResourceServer {
  // ===== 私有属性容器 =====
  private _props: ResourceState;

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
    this._props = {
      repositoryId: params.repositoryId,
      folderId: params.folderId,
      type: params.type,
      name: params.name,
      path: params.path,
      mimeType: params.mimeType,
      size: params.size,
      content: params.content,
      childrenCount: params.childrenCount,
      metadata: params.metadata,
      stats: params.stats,
      status: params.status,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      version: params.version,
      deletedAt: params.deletedAt ?? null,
      externalLinks: params.externalLinks ?? null,
    };
  }

  // ===== Getters =====
  get repositoryId(): RepositoryId {
    return this._props.repositoryId;
  }

  get folderId(): FolderId | null {
    return this._props.folderId;
  }

  get type(): ResourceType {
    return this._props.type;
  }

  get name(): string {
    return this._props.name;
  }

  get path(): string {
    return this._props.path;
  }

  get mimeType(): string | null {
    return this._props.mimeType;
  }

  get size(): number | null {
    return this._props.size;
  }

  get content(): string | null {
    return this._props.content;
  }

  get childrenCount(): number | null {
    return this._props.childrenCount;
  }

  get metadata(): ResourceMetadataDTO {
    return this._props.metadata.toDTO();
  }

  get stats(): ResourceStatsDTO {
    return this._props.stats.toDTO();
  }

  get status(): ResourceStatus {
    return this._props.status;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get version(): number {
    return this._props.version;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // ===== 业务方法 =====

  public rename(newName: string): void {
    this._props.name = newName;
    this._props.updatedAt = new Date();
    this._props.version++;
  }

  public updateContent(content: string): void {
    this._props.content = content;
    this._props.updatedAt = new Date();
    this._props.version++;
    // Update stats
    this._props.stats = this._props.stats.recordEdit();
  }

  public moveTo(folderId: FolderId | null, newPath: string): void {
    this._props.folderId = folderId;
    this._props.path = newPath;
    this._props.updatedAt = new Date();
    this._props.version++;
  }

  public archive(): void {
    if (this._props.status === ResourceStatus.Archived) {
      throw new Error('资源已归档');
    }
    this._props.status = ResourceStatus.Archived;
    this._props.updatedAt = new Date();
    this._props.version++;
  }

  public unarchive(): void {
    if (this._props.status !== ResourceStatus.Archived) {
      throw new Error('资源未归档');
    }
    this._props.status = ResourceStatus.Active;
    this._props.updatedAt = new Date();
    this._props.version++;
  }

  public delete(): void {
    this._props.status = ResourceStatus.Deleted;
    this._props.updatedAt = new Date();
    this._props.version++;
  }

  public recordView(): void {
    this._props.stats = this._props.stats.recordView();
    this._props.updatedAt = new Date();
  }

  public isActive(): boolean {
    return this._props.status === ResourceStatus.Active;
  }

  public isArchived(): boolean {
    return this._props.status === ResourceStatus.Archived;
  }

  public isDeleted(): boolean {
    return this._props.status === ResourceStatus.Deleted;
  }

  public isFolder(): boolean {
    return this._props.type === ResourceType.FOLDER;
  }

  public isFile(): boolean {
    return this._props.type === ResourceType.FILE;
  }

  // ===== DTO 转换 =====

  public toServerDTO(): ResourceServerDTO {
    return {
      id: String(this.id),
      repositoryId: String(this._props.repositoryId),
      folderId: this._props.folderId ? String(this._props.folderId) : null,
      name: this._props.name,
      type: this._props.type,
      path: this._props.path,
      mimeType: this._props.mimeType,
      size: this._props.size,
      content: this._props.content,
      childrenCount: this._props.childrenCount,
      metadata: this._props.metadata.toDTO(),
      stats: this._props.stats.toDTO(),
      status: this._props.status,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      version: this._props.version,
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
      externalLinks: this._props.externalLinks,
    };
  }

  public toPersistenceDTO(): ResourcePersistenceDTO {
    return {
      id: String(this.id),
      repositoryId: String(this._props.repositoryId),
      folderId: this._props.folderId ? String(this._props.folderId) : null,
      name: this._props.name,
      type: this._props.type,
      path: this._props.path,
      mimeType: this._props.mimeType,
      size: this._props.size,
      content: this._props.content,
      metadata: JSON.stringify(this._props.metadata.toDTO()),
      stats: JSON.stringify(this._props.stats.toDTO()),
      status: this._props.status,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      version: this._props.version,
      deletedAt: this._props.deletedAt,
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
      repositoryId: RepositoryIdType.of(dto.repositoryId),
      folderId: dto.folderId ? dto.folderId as FolderId : null,
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
      repositoryId: RepositoryIdType.of(dto.repositoryId),
      folderId: dto.folderId ? dto.folderId as FolderId : null,
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
