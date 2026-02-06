/**
 * Resource Entity - Domain Client
 * 资源实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ResourceClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: ResourceClientDTO): Resource
 * - Instance toDTO(): ResourceClientDTO
 */

import type {
  ResourceClient,
  ResourceClientDTO,
  ResourceMetadataDTO,
  ResourceStatsDTO,
} from '@dailyuse/contracts/repository';
import type { ResourceType, ResourceStatus } from '@dailyuse/contracts/repository';
import type { RepositoryId, FolderId } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils';
import {
  ResourceId,
  ResourceMetadata,
  ResourceStats,
} from '@dailyuse/domain-shared/repository';

export class Resource extends Entity<ResourceId> implements ResourceClient {
  // ================= 1. Backing Fields =================
  private _repositoryId: RepositoryId;
  private _folderId: FolderId | null;
  private _name: string;
  private _type: ResourceType;
  private _mimeType: string;
  private _path: string;
  private _size: number;
  private _content: string | null;
  private _metadata: ResourceMetadata;
  private _stats: ResourceStats;
  private _status: ResourceStatus;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: ResourceId;
    repositoryId: RepositoryId;
    folderId: FolderId | null;
    name: string;
    type: ResourceType;
    mimeType: string;
    path: string;
    size: number;
    content: string | null;
    metadata: ResourceMetadata;
    stats: ResourceStats;
    status: ResourceStatus;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    super(params.id);
    this._repositoryId = params.repositoryId;
    this._folderId = params.folderId;
    this._name = params.name;
    this._type = params.type;
    this._mimeType = params.mimeType;
    this._path = params.path;
    this._size = params.size;
    this._content = params.content;
    this._metadata = params.metadata;
    this._stats = params.stats;
    this._status = params.status;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
  }

  // ================= 3. Getters =================
  get repositoryId(): RepositoryId {
    return this._repositoryId;
  }

  get folderId(): FolderId | null {
    return this._folderId;
  }

  get name(): string {
    return this._name;
  }

  get type(): ResourceType {
    return this._type;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  get path(): string {
    return this._path;
  }

  get size(): number {
    return this._size;
  }

  get content(): string | null {
    return this._content;
  }

  get metadata(): ResourceMetadata {
    return this._metadata;
  }

  get stats(): ResourceStats {
    return this._stats;
  }

  get status(): ResourceStatus {
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

  get isDraft(): boolean {
    return this._status === 'Draft';
  }

  get statusText(): string {
    const statusTextMap: Record<ResourceStatus, string> = {
      Active: '活跃',
      Archived: '已归档',
      Deleted: '已删除',
      Draft: '草稿',
    };
    return statusTextMap[this._status] ?? this._status;
  }

  get typeText(): string {
    const typeTextMap: Record<ResourceType, string> = {
      FILE: '文件',
      FOLDER: '文件夹',
    };
    return typeTextMap[this._type] ?? this._type;
  }

  get displayName(): string {
    // Remove extension from filename for display
    const lastDotIndex = this._name.lastIndexOf('.');
    if (lastDotIndex > 0 && this._type === 'FILE') {
      return this._name.substring(0, lastDotIndex);
    }
    return this._name;
  }

  get formattedSize(): string {
    const bytes = this._size;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  get createdAtText(): string {
    return this._createdAt.toLocaleString();
  }

  get updatedAtText(): string {
    return this._updatedAt.toLocaleString();
  }

  get extension(): string {
    const lastDotIndex = this._name.lastIndexOf('.');
    if (lastDotIndex > 0) {
      return this._name.substring(lastDotIndex);
    }
    return '';
  }

  get icon(): string {
    // Return Material Design icon name based on type and extension
    if (this._type === 'FOLDER') {
      return 'mdi-folder';
    }
    const ext = this.extension.toLowerCase();
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
    return iconMap[ext] ?? 'mdi-file';
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: ResourceClientDTO): Resource {
    return new Resource({
      id: ResourceId.of(dto.id),
      repositoryId: dto.repositoryId as RepositoryId,
      folderId: dto.folderId as FolderId | null,
      name: dto.name,
      type: dto.type,
      mimeType: dto.mimeType,
      path: dto.path,
      size: dto.size,
      content: dto.content,
      metadata: ResourceMetadata.fromDTO(dto.metadata),
      stats: ResourceStats.fromDTO(dto.stats),
      status: dto.status,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): ResourceClientDTO {
    return {
      id: String(this.id),
      repositoryId: String(this._repositoryId),
      folderId: this._folderId ? String(this._folderId) : null,
      name: this._name,
      type: this._type,
      mimeType: this._mimeType,
      path: this._path,
      size: this._size,
      content: this._content,
      metadata: this._metadata.toDTO(),
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
      isDraft: this.isDraft,
      statusText: this.statusText,
      typeText: this.typeText,
      displayName: this.displayName,
      formattedSize: this.formattedSize,
      createdAtText: this.createdAtText,
      updatedAtText: this.updatedAtText,
      extension: this.extension,
      icon: this.icon,
    };
  }
}
