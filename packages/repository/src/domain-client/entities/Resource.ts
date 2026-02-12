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
import type { RepositoryId as IRepositoryId, FolderId as IFolderId } from '@dailyuse/contracts/primitives';
import { Entity } from '@dailyuse/utils';
import { ResourceId } from '../../domain-shared/value-objects/resource-id';
import { ResourceMetadata } from '../../domain-shared/value-objects/resource-metadata';
import { ResourceStats } from '../../domain-shared/value-objects/resource-stats';
import { RepositoryId } from '../../domain-shared/value-objects/repository-id';
import { FolderId } from '../../domain-shared/value-objects/folder-id';

// 内部状态接口：使用 domain-shared 类类型（有 .toDTO() 等方法）
interface ResourceState {
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
}

export class Resource extends Entity<ResourceId> implements ResourceClient {
  private readonly _props: ResourceState;

  private constructor(props: ResourceState) {
    super(props.id);
    this._props = props;
  }

  // ================= Getters =================
  get repositoryId(): IRepositoryId {
    return this._props.repositoryId;
  }

  get folderId(): IFolderId | null {
    return this._props.folderId;
  }

  get name(): string {
    return this._props.name;
  }

  get type(): ResourceType {
    return this._props.type;
  }

  get mimeType(): string {
    return this._props.mimeType;
  }

  get path(): string {
    return this._props.path;
  }

  get size(): number {
    return this._props.size;
  }

  get content(): string | null {
    return this._props.content;
  }

  get metadata(): ResourceMetadata {
    return this._props.metadata;
  }

  get stats(): ResourceStats {
    return this._props.stats;
  }

  get status(): ResourceStatus {
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

  get isDraft(): boolean {
    return this._props.status === 'Draft';
  }

  get statusText(): string {
    const statusTextMap: Record<ResourceStatus, string> = {
      Active: '活跃',
      Archived: '已归档',
      Deleted: '已删除',
      Draft: '草稿',
    };
    return statusTextMap[this._props.status] ?? this._props.status;
  }

  get typeText(): string {
    const typeTextMap: Record<ResourceType, string> = {
      FILE: '文件',
      FOLDER: '文件夹',
    };
    return typeTextMap[this._props.type] ?? this._props.type;
  }

  get displayName(): string {
    // Remove extension from filename for display
    const lastDotIndex = this._props.name.lastIndexOf('.');
    if (lastDotIndex > 0 && this._props.type === 'FILE') {
      return this._props.name.substring(0, lastDotIndex);
    }
    return this._props.name;
  }

  get formattedSize(): string {
    const bytes = this._props.size;
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  get createdAtText(): string {
    return this._props.createdAt.toLocaleString();
  }

  get updatedAtText(): string {
    return this._props.updatedAt.toLocaleString();
  }

  get extension(): string {
    const lastDotIndex = this._props.name.lastIndexOf('.');
    if (lastDotIndex > 0) {
      return this._props.name.substring(lastDotIndex);
    }
    return '';
  }

  get icon(): string {
    // Return Material Design icon name based on type and extension
    if (this._props.type === 'FOLDER') {
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

  // ================= Factory Methods =================
  public static fromDTO(dto: ResourceClientDTO): Resource {
    return new Resource({
      id: ResourceId.of(dto.id),
      repositoryId: RepositoryId.of(dto.repositoryId),
      folderId: dto.folderId ? FolderId.of(dto.folderId) : null,
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

  // ================= DTO Conversion =================
  public toDTO(): ResourceClientDTO {
    return {
      id: String(this.id),
      repositoryId: String(this._props.repositoryId),
      folderId: this._props.folderId ? String(this._props.folderId) : null,
      name: this._props.name,
      type: this._props.type,
      mimeType: this._props.mimeType,
      path: this._props.path,
      size: this._props.size,
      content: this._props.content,
      metadata: this._props.metadata.toDTO(),
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
