/**
 * Folder 实体实现 (Server)
 */
import type {
  FolderMetadataDTO,
} from '@dailyuse/contracts/repository';
import { Entity } from '@dailyuse/utils';
import { FolderMetadata, ResourceId } from '../value-objects';

// ============ 本地类型定义 ============
// TODO: 这些类型应该移到 @dailyuse/contracts/repository

/**
 * Folder Server DTO
 */
export interface FolderServerDTO {
  id: string;
  repositoryId: string;
  parentId: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataDTO;
  createdAt: number;
  updatedAt: number;
  children?: FolderServerDTO[] | null;
}

/**
 * Folder Persistence DTO
 */
export interface FolderPersistenceDTO {
  id: string;
  repositoryId: string;
  parentId: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Folder Client DTO
 */
export interface FolderClientDTO {
  id: string;
  repositoryId: string;
  parentId: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadataDTO;
  createdAt: number;
  updatedAt: number;
  children?: FolderClientDTO[] | null;

  // UI 计算字段
  depth: number;
  isRoot: boolean;
  hasChildren: boolean;
  pathParts: string[];
  displayName: string;
  createdAtText: string;
  updatedAtText: string;
}

/**
 * Folder Server Interface
 */
export interface FolderServer {
  readonly id: string;
  readonly repositoryId: string;
  readonly parentId: string | null;
  readonly name: string;
  readonly path: string;
  readonly order: number;
  readonly isExpanded: boolean;
  readonly metadata: FolderMetadata;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly children: FolderServer[] | null;

  rename(newName: string): void;
  moveTo(newParentId: string | null, newParentPath?: string): void;
  updatePath(newPath: string): void;
  updateMetadata(metadata: Partial<FolderMetadataDTO>): void;
  setExpanded(isExpanded: boolean): void;
  toServerDTO(includeChildren?: boolean): FolderServerDTO;
  toClientDTO(includeChildren?: boolean): FolderClientDTO;
  toPersistenceDTO(): FolderPersistenceDTO;
}

/** Props interface for Folder */
interface FolderProps {
  repositoryId: string;
  parentId: string | null;
  name: string;
  path: string;
  order: number;
  isExpanded: boolean;
  metadata: FolderMetadata;
  createdAt: Date;
  updatedAt: Date;
  children: Folder[] | null;
}

export class Folder extends Entity<ResourceId> implements FolderServer {
  // ===== 私有属性容器 =====
  private _props: FolderProps;

  // ===== 私有构造函数 =====
  private constructor(
    id: ResourceId,
    params: {
      repositoryId: string;
      parentId: string | null;
      name: string;
      path: string;
      order: number;
      isExpanded: boolean;
      metadata: FolderMetadata;
      createdAt: Date;
      updatedAt: Date;
      children?: Folder[] | null;
    },
  ) {
    super(id);
    this._props = {
      repositoryId: params.repositoryId,
      parentId: params.parentId,
      name: params.name,
      path: params.path,
      order: params.order,
      isExpanded: params.isExpanded,
      metadata: params.metadata,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      children: params.children ?? null,
    };
  }

  // ===== Getters =====
  get repositoryId(): string {
    return this._props.repositoryId;
  }

  get parentId(): string | null {
    return this._props.parentId;
  }

  get name(): string {
    return this._props.name;
  }

  get path(): string {
    return this._props.path;
  }

  get order(): number {
    return this._props.order;
  }

  get isExpanded(): boolean {
    return this._props.isExpanded;
  }

  get metadata(): FolderMetadata {
    return this._props.metadata;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get children(): Folder[] | null {
    return this._props.children;
  }

  // ===== 业务方法 =====
  rename(newName: string): void {
    if (!newName || newName.trim() === '') {
      throw new Error('Folder name cannot be empty');
    }

    const oldPath = this._props.path;
    this._props.name = newName;

    // 更新路径
    if (this._props.parentId) {
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
      this._props.path = `${parentPath}/${newName}`;
    } else {
      this._props.path = `/${newName}`;
    }

    this._props.updatedAt = new Date();
  }

  moveTo(newParentId: string | null, newParentPath?: string): void {
    this._props.parentId = newParentId;

    // 更新路径
    if (newParentPath) {
      this._props.path = `${newParentPath}/${this._props.name}`;
    } else {
      this._props.path = `/${this._props.name}`;
    }

    this._props.updatedAt = new Date();
  }

  updatePath(newPath: string): void {
    this._props.path = newPath;
    this._props.updatedAt = new Date();
  }

  updateMetadata(metadata: Partial<FolderMetadataDTO>): void {
    const currentDTO = this._props.metadata.toDTO();
    const merged = { ...currentDTO, ...metadata };
    this._props.metadata = FolderMetadata.fromDTO(merged);
    this._props.updatedAt = new Date();
  }

  setExpanded(isExpanded: boolean): void {
    this._props.isExpanded = isExpanded;
    this._props.updatedAt = new Date();
  }

  // ===== DTO 转换方法 =====
  toServerDTO(includeChildren = false): FolderServerDTO {
    return {
      id: String(this.id),
      repositoryId: this._props.repositoryId,
      parentId: this._props.parentId,
      name: this._props.name,
      path: this._props.path,
      order: this._props.order,
      isExpanded: this._props.isExpanded,
      metadata: this._props.metadata.toDTO(),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      children: includeChildren
        ? this._props.children?.map((c) => c.toServerDTO(true)) ?? null
        : null,
    };
  }

  toClientDTO(includeChildren = false): FolderClientDTO {
    // 计算路径深度
    const depth = this._props.path.split('/').filter((p) => p.length > 0).length;
    const isRoot = this._props.parentId === null;
    const hasChildren = this._props.children !== null && this._props.children.length > 0;
    const pathParts = this._props.path.split('/').filter((p) => p.length > 0);

    // 显示名称（截断过长的名称）
    const displayName = this._props.name.length > 30 ? this._props.name.substring(0, 27) + '...' : this._props.name;

    // 时间格式化
    const formattedCreatedAt = this._props.createdAt.toLocaleString();
    const formattedUpdatedAt = this._props.updatedAt.toLocaleString();

    return {
      id: String(this.id),
      repositoryId: this._props.repositoryId,
      parentId: this._props.parentId,
      name: this._props.name,
      path: this._props.path,
      order: this._props.order,
      isExpanded: this._props.isExpanded,
      metadata: this._props.metadata.toDTO(),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      children: includeChildren
        ? this._props.children?.map((c) => c.toClientDTO(true)) ?? null
        : null,

      // UI 计算字段
      depth,
      isRoot,
      hasChildren,
      pathParts,
      displayName,
      createdAtText: formattedCreatedAt,
      updatedAtText: formattedUpdatedAt,
    };
  }

  toPersistenceDTO(): FolderPersistenceDTO {
    return {
      id: String(this.id),
      repositoryId: this._props.repositoryId,
      parentId: this._props.parentId,
      name: this._props.name,
      path: this._props.path,
      order: this._props.order,
      isExpanded: this._props.isExpanded,
      metadata: JSON.stringify(this._props.metadata.toDTO()),
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
    };
  }

  // ===== 静态工厂方法 =====
  static create(params: {
    repositoryId: string;
    parentId?: string | null;
    name: string;
    parentPath?: string | null;
    order?: number;
    metadata?: Partial<FolderMetadataDTO>;
  }): Folder {
    const path = params.parentPath ? `${params.parentPath}/${params.name}` : `/${params.name}`;
    const metadata = FolderMetadata.create(params.metadata ?? {});
    const now = new Date();
    const id = ResourceId.of(ResourceId.generate());

    return new Folder(id, {
      repositoryId: params.repositoryId,
      parentId: params.parentId ?? null,
      name: params.name,
      path,
      order: params.order ?? 0,
      isExpanded: false,
      metadata,
      createdAt: now,
      updatedAt: now,
      children: null,
    });
  }

  static fromServerDTO(dto: FolderServerDTO): Folder {
    const children = dto.children ? dto.children.map((c) => Folder.fromServerDTO(c)) : null;
    const id = ResourceId.of(dto.id);

    return new Folder(id, {
      repositoryId: dto.repositoryId,
      parentId: dto.parentId,
      name: dto.name,
      path: dto.path,
      order: dto.order,
      isExpanded: dto.isExpanded,
      metadata: FolderMetadata.fromDTO(dto.metadata),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      children,
    });
  }

  static fromPersistenceDTO(dto: FolderPersistenceDTO): Folder {
    const id = ResourceId.of(dto.id);

    return new Folder(id, {
      repositoryId: dto.repositoryId,
      parentId: dto.parentId,
      name: dto.name,
      path: dto.path,
      order: dto.order,
      isExpanded: dto.isExpanded,
      metadata: FolderMetadata.fromDTO(JSON.parse(dto.metadata)),
      createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt),
      updatedAt: dto.updatedAt instanceof Date ? dto.updatedAt : new Date(dto.updatedAt),
      children: null,
    });
  }
}
