/**
 * Resource Entity - Server Implementation
 * 资源实体 - 服务端实现
 */
import type {
  ResourceServerDTO,
  ResourceMetadataDTO,
  ResourceStatsDTO,
  ExternalLink,
} from '@dailyuse/contracts/repository';
import type { ResourceId, RepositoryId, FolderId, IdentityId } from '@dailyuse/contracts/primitives';
import { ResourceStatus, ResourceType } from '@dailyuse/contracts/repository';
import { Entity } from '@dailyuse/utils/domain';
import { ResourceId as ResourceIdType } from '../../domain-shared/value-objects/resource-id';
import { ResourceMetadata, ResourceStats } from '../value-objects';
import { BusinessRuleViolationError } from '@dailyuse/utils/errors';

/** Domain state interface for Resource */
export interface ResourceState {
  id: ResourceId;
  repositoryId: RepositoryId;
  identityId: string;
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

const ILLEGAL_NAME_CHARS = /[\\/:*?"<>|\x00-\x1F]/;

export class Resource extends Entity<ResourceId> {
  // ===== 私有属性容器 =====
  private _props: ResourceState;

  // ===== 构造函数（私有） =====
  private constructor(state: ResourceState) {
    super(state.id);
    this._props = state;
  }

  // ===== Getters =====
  get repositoryId(): RepositoryId {
    return this._props.repositoryId;
  }

  get identityId(): string {
    return this._props.identityId;
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
    Resource.assertValidName(newName);

    this._props.name = newName;
    this._props.path = Resource.replaceNameInPath(this._props.path, newName);
    this._props.updatedAt = new Date();
    this._props.version++;
  }

  public updateContent(params: {
    content?: string | null;
    size?: number | null;
    mimeType?: string | null;
    metadata?: Partial<ResourceMetadataDTO> | null;
  }): void {
    if (params.content !== undefined) {
      this._props.content = params.content;
    }
    if (params.size !== undefined) {
      this._props.size = params.size;
    }
    if (params.mimeType !== undefined) {
      this._props.mimeType = params.mimeType;
    }
    if (params.metadata) {
      const current = this._props.metadata.toDTO();
      this._props.metadata = ResourceMetadata.fromDTO({
        ...current,
        ...params.metadata,
      });
    }

    this._props.updatedAt = new Date();
    this._props.version++;
    this._props.stats = this._props.stats.recordEdit();
  }

  public updateMetadata(metadata: Partial<ResourceMetadataDTO>): void {
    const current = this._props.metadata.toDTO();
    this._props.metadata = ResourceMetadata.fromDTO({
      ...current,
      ...metadata,
    });
    this._props.updatedAt = new Date();
    this._props.version++;
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
    return this._props.type === ResourceType.Folder;
  }

  public isFile(): boolean {
    return this._props.type === ResourceType.File;
  }

  public getExtension(): string {
    const dotIndex = this._props.name.lastIndexOf('.');
    if (dotIndex <= 0) return '';
    return this._props.name.slice(dotIndex).toLowerCase();
  }

  // ===== DTO 转换 =====

  public toServerDTO(): ResourceServerDTO {
    const metadata = {
      ...this._props.metadata.toDTO(),
      mimeType: this._props.mimeType,
    };

    return {
      id: this.id as ResourceId,
      repositoryId: this._props.repositoryId as RepositoryId,
      identityId: this._props.identityId as IdentityId,
      folderId: this._props.folderId as FolderId | null,
      name: this._props.name,
      type: this._props.type,
      path: this._props.path,
      mimeType: this._props.mimeType,
      size: this._props.size,
      content: this._props.content,
      childrenCount: this._props.childrenCount,
      metadata,
      stats: this._props.stats.toDTO(),
      status: this._props.status,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      version: this._props.version,
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
      externalLinks: this._props.externalLinks,
    };
  }

  public toClientDTO(): import('@dailyuse/contracts/repository').ResourceClientDTO {
    const extension = this.getExtension();
    const isDeleted = this._props.status === ResourceStatus.Deleted;
    const isArchived = this._props.status === ResourceStatus.Archived;
    const isActive = this._props.status === ResourceStatus.Active;
    const isDraft = this._props.status === ResourceStatus.Draft;

    const iconMap: Record<string, string> = {
      '.md': 'mdi-language-markdown',
      '.txt': 'mdi-file-document',
      '.pdf': 'mdi-file-pdf-box',
      '.jpg': 'mdi-file-image',
      '.jpeg': 'mdi-file-image',
      '.png': 'mdi-file-image',
      '.gif': 'mdi-file-image',
      '.svg': 'mdi-file-image',
      '.doc': 'mdi-file-word',
      '.docx': 'mdi-file-word',
      '.xls': 'mdi-file-excel',
      '.xlsx': 'mdi-file-excel',
      '.ppt': 'mdi-file-powerpoint',
      '.pptx': 'mdi-file-powerpoint',
      '.zip': 'mdi-folder-zip',
      '.rar': 'mdi-folder-zip',
      '.js': 'mdi-nodejs',
      '.ts': 'mdi-language-typescript',
      '.json': 'mdi-code-json',
      '.html': 'mdi-language-html5',
      '.css': 'mdi-language-css3',
    };

    const icon =
      this._props.type === ResourceType.Folder ? 'mdi-folder' : (iconMap[extension] ?? 'mdi-file');

    return {
      id: this.id as import('@dailyuse/contracts/repository').ResourceClientDTO['id'],
      repositoryId: this._props.repositoryId as import('@dailyuse/contracts/repository').ResourceClientDTO['repositoryId'],
      folderId: this._props.folderId as import('@dailyuse/contracts/repository').ResourceClientDTO['folderId'],
      name: this._props.name,
      type: this._props.type,
      mimeType: this._props.mimeType ?? '',
      path: this._props.path,
      size: this._props.size ?? 0,
      content: this._props.content,
      metadata: this._props.metadata.toDTO(),
      stats: this._props.stats.toDTO(),
      status: this._props.status,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
      version: this._props.version,
      isDeleted,
      isArchived,
      isActive,
      isDraft,
      extension,
      icon,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: {
    repositoryId: RepositoryId;
    identityId: string;
    folderId?: FolderId | null;
    name: string;
    type: ResourceType;
    path: string;
    mimeType?: string | null;
    size?: number | null;
    content?: string | null;
    metadata?: Partial<ResourceMetadataDTO>;
    allowedExtensions?: string[] | null;
  }): Resource {
    Resource.assertValidName(params.name);
    if (params.type === ResourceType.File && params.allowedExtensions?.length) {
      Resource.assertExtensionAllowed(params.name, params.allowedExtensions);
    }

    const id = ResourceIdType.of(ResourceIdType.generate());
    const now = new Date();

    return new Resource({
      id,
      repositoryId: params.repositoryId,
      identityId: params.identityId,
      folderId: params.folderId ?? null,
      type: params.type,
      name: params.name,
      path: params.path,
      mimeType: params.mimeType ?? null,
      size: params.size ?? null,
      content: params.content ?? null,
      childrenCount: params.type === ResourceType.Folder ? 0 : null,
      metadata: params.metadata
        ? ResourceMetadata.create({
            ...params.metadata,
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

  public static load(state: ResourceState): Resource {
    return new Resource(state);
  }

  private static assertValidName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new BusinessRuleViolationError('Resource name cannot be empty.');
    }
    if (ILLEGAL_NAME_CHARS.test(name)) {
      throw new BusinessRuleViolationError('Resource name contains illegal characters.');
    }
  }

  private static assertExtensionAllowed(name: string, allowed: string[]): void {
    const extension = Resource.extractExtension(name);
    if (!extension) {
      throw new BusinessRuleViolationError('File extension is required.');
    }
    const normalizedAllowed = allowed.map((ext) => ext.toLowerCase());
    if (!normalizedAllowed.includes(extension)) {
      throw new BusinessRuleViolationError(`File extension ${extension} is not allowed.`);
    }
  }

  private static extractExtension(name: string): string {
    const dotIndex = name.lastIndexOf('.');
    if (dotIndex <= 0) return '';
    return name.slice(dotIndex).toLowerCase();
  }

  private static replaceNameInPath(path: string, newName: string): string {
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash < 0) return `/${newName}`;
    return `${path.slice(0, lastSlash + 1)}${newName}`;
  }
}
