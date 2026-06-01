/**
 * Folder 实体实现 (Server)
 */
import type { FolderMetadataDTO } from '@dailyuse/contracts/repository';
import { Entity } from '@dailyuse/utils/domain';
import { FolderMetadata, ResourceId } from '../value-objects';
import { BusinessRuleViolationError } from '@dailyuse/utils/errors';

// ============ 本地类型定义 ============
// TODO: 这些类型应该移到 @dailyuse/contracts/repository

/**
 * Folder Server DTO
 */
export interface FolderServerDTO {
  id: string;
  repositoryId: string;
  identityId: string;
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
 * Folder storage shape
 */
export interface FolderStorageShape {
  id: string;
  repositoryId: string;
  identityId: string;
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
  identityId: string;
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
  readonly identityId: string;
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
  toStorage(): FolderStorageShape;
}

/** Domain state interface for Folder */
export interface FolderState {
  id: ResourceId;
  repositoryId: string;
  identityId: string;
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

const ILLEGAL_NAME_CHARS = /[\\/:*?"<>|\x00-\x1F]/;

export class Folder extends Entity<ResourceId> {
  // ===== 私有属性容器 =====
  private _props: FolderState;

  // ===== 私有构造函数 =====
  private constructor(state: FolderState) {
    super(state.id);
    this._props = state;
  }

  // ===== Getters =====
  get repositoryId(): string {
    return this._props.repositoryId;
  }

  get identityId(): string {
    return this._props.identityId;
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
      throw new BusinessRuleViolationError('Folder name cannot be empty');
    }
    if (ILLEGAL_NAME_CHARS.test(newName)) {
      throw new BusinessRuleViolationError('Folder name contains illegal characters');
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
      identityId: this._props.identityId,
      parentId: this._props.parentId,
      name: this._props.name,
      path: this._props.path,
      order: this._props.order,
      isExpanded: this._props.isExpanded,
      metadata: this._props.metadata.toDTO(),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      children: includeChildren
        ? (this._props.children?.map((c) => c.toServerDTO(true)) ?? null)
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
    const displayName =
      this._props.name.length > 30 ? this._props.name.substring(0, 27) + '...' : this._props.name;

    // 时间格式化
    const formattedCreatedAt = isNaN(this._props.createdAt.getTime())
      ? '-'
      : this._props.createdAt.toLocaleString();
    const formattedUpdatedAt = isNaN(this._props.updatedAt.getTime())
      ? '-'
      : this._props.updatedAt.toLocaleString();

    return {
      id: String(this.id),
      repositoryId: this._props.repositoryId,
      identityId: this._props.identityId,
      parentId: this._props.parentId,
      name: this._props.name,
      path: this._props.path,
      order: this._props.order,
      isExpanded: this._props.isExpanded,
      metadata: this._props.metadata.toDTO(),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      children: includeChildren
        ? (this._props.children?.map((c) => c.toClientDTO(true)) ?? null)
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

  toStorage(): FolderStorageShape {
    return {
      id: String(this.id),
      repositoryId: this._props.repositoryId,
      identityId: this._props.identityId,
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
    identityId: string;
    parentId?: string | null;
    name: string;
    parentPath?: string | null;
    order?: number;
    metadata?: Partial<FolderMetadataDTO>;
  }): Folder {
    if (!params.name || params.name.trim() === '') {
      throw new BusinessRuleViolationError('Folder name cannot be empty');
    }
    if (ILLEGAL_NAME_CHARS.test(params.name)) {
      throw new BusinessRuleViolationError('Folder name contains illegal characters');
    }

    const path = params.parentPath ? `${params.parentPath}/${params.name}` : `/${params.name}`;
    const metadata = FolderMetadata.create(params.metadata ?? {});
    const now = new Date();
    const id = ResourceId.of(ResourceId.generate());

    return new Folder({
      id,
      repositoryId: params.repositoryId,
      identityId: params.identityId,
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

  static load(state: FolderState): Folder {
    return new Folder(state);
  }
}
