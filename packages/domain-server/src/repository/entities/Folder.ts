/**
 * Folder 实体实现 (Server)
 */
import type {
  FolderClientDTO,
  FolderMetadataServerDTO,
  FolderPersistenceDTO,
  FolderServer,
  FolderServerDTO,
} from '@dailyuse/contracts/repository';
import { FolderMetadata } from '../value-objects';

export class Folder implements FolderServer {
  // ===== 私有字段 =====
  private _uuid: string;
  private _repositoryUuid: string;
  private _parentUuid: string | null;
  private _name: string;
  private _path: string;
  private _order: number;
  private _isExpanded: boolean;
  private _metadata: FolderMetadata;
  private _createdAt: number;
  private _updatedAt: number;
  private _children: FolderServer[] | null;

  // ===== 私有构造函数 =====
  private constructor(
    uuid: string,
    repositoryUuid: string,
    parentUuid: string | null,
    name: string,
    path: string,
    order: number,
    isExpanded: boolean,
    metadata: FolderMetadata,
    createdAt: number,
    updatedAt: number,
    children: FolderServer[] | null = null,
  ) {
    this._uuid = uuid;
    this._repositoryUuid = repositoryUuid;
    this._parentUuid = parentUuid;
    this._name = name;
    this._path = path;
    this._order = order;
    this._isExpanded = isExpanded;
    this._metadata = metadata;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
    this._children = children;
  }

  // ===== Getters =====
  get uuid(): string {
    return this._uuid;
  }
  get repositoryUuid(): string {
    return this._repositoryUuid;
  }
  get parentUuid(): string | null {
    return this._parentUuid;
  }
  get name(): string {
    return this._name;
  }
  get path(): string {
    return this._path;
  }
  get order(): number {
    return this._order;
  }
  get isExpanded(): boolean {
    return this._isExpanded;
  }
  get metadata(): FolderMetadata {
    return this._metadata;
  }
  get createdAt(): number {
    return this._createdAt;
  }
  get updatedAt(): number {
    return this._updatedAt;
  }
  get children(): FolderServer[] | null {
    return this._children;
  }

  // ===== 业务方法 =====
  rename(newName: string): void {
    if (!newName || newName.trim() === '') {
      throw new Error('Folder name cannot be empty');
    }

    const oldPath = this._path;
    this._name = newName;

    // 更新路径
    if (this._parentUuid) {
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
      this._path = `${parentPath}/${newName}`;
    } else {
      this._path = `/${newName}`;
    }

    this._updatedAt = Date.now();
  }

  moveTo(newParentUuid: string | null, newParentPath?: string): void {
    this._parentUuid = newParentUuid;

    // 更新路径
    if (newParentPath) {
      this._path = `${newParentPath}/${this._name}`;
    } else {
      this._path = `/${this._name}`;
    }

    this._updatedAt = Date.now();
  }

  updatePath(newPath: string): void {
    this._path = newPath;
    this._updatedAt = Date.now();
  }

  updateMetadata(metadata: Partial<FolderMetadataServerDTO>): void {
    const currentDTO = this._metadata.toServerDTO();
    const merged = { ...currentDTO, ...metadata };
    this._metadata = FolderMetadata.fromServerDTO(merged);
    this._updatedAt = Date.now();
  }

  setExpanded(isExpanded: boolean): void {
    this._isExpanded = isExpanded;
    this._updatedAt = Date.now();
  }

  // ===== DTO 转换方法 =====
  toServerDTO(includeChildren = false): FolderServerDTO {
    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      parentUuid: this._parentUuid,
      name: this._name,
      path: this._path,
      order: this._order,
      isExpanded: this._isExpanded,
      metadata: this._metadata.toServerDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      children: includeChildren
        ? this._children?.map((c) => (c as Folder).toServerDTO(true)) || null
        : null,
    };
  }

  toClientDTO(includeChildren = false): FolderClientDTO {
    // 计算路径深度
    const depth = this._path.split('/').filter((p) => p.length > 0).length;
    const isRoot = this._parentUuid === null;
    const hasChildren = this._children !== null && this._children.length > 0;
    const pathParts = this._path.split('/').filter((p) => p.length > 0);

    // 显示名称（截断过长的名称）
    const displayName = this._name.length > 30 ? this._name.substring(0, 27) + '...' : this._name;

    // 时间格式化
    const formattedCreatedAt = new Date(this._createdAt).toLocaleString();
    const formattedUpdatedAt = new Date(this._updatedAt).toLocaleString();

    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      parentUuid: this._parentUuid,
      name: this._name,
      path: this._path,
      order: this._order,
      isExpanded: this._isExpanded,
      metadata: this._metadata.toServerDTO() as any, // TODO: 待 metadata 实现 toClientDTO
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      children: includeChildren
        ? this._children?.map((c) => (c as Folder).toClientDTO(true)) || null
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
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      parentUuid: this._parentUuid,
      name: this._name,
      path: this._path,
      order: this._order,
      isExpanded: this._isExpanded,
      metadata: JSON.stringify(this._metadata.toServerDTO()),
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
    };
  }

  // ===== 静态工厂方法 =====
  static create(params: {
    repositoryUuid: string;
    parentUuid?: string | null;
    name: string;
    parentPath?: string | null;
    order?: number;
    metadata?: Partial<FolderMetadataServerDTO>;
  }): Folder {
    const path = params.parentPath ? `${params.parentPath}/${params.name}` : `/${params.name}`;

    const metadata = FolderMetadata.create(params.metadata);
    const now = Date.now();

    return new Folder(
      crypto.randomUUID(),
      params.repositoryUuid,
      params.parentUuid ?? null,
      params.name,
      path,
      params.order ?? 0,
      false,
      metadata,
      now,
      now,
      null,
    );
  }

  static fromServerDTO(dto: FolderServerDTO): Folder {
    const children = dto.children ? dto.children.map((c) => Folder.fromServerDTO(c)) : null;

    return new Folder(
      dto.uuid,
      dto.repositoryUuid,
      dto.parentUuid ?? null,
      dto.name,
      dto.path,
      dto.order,
      dto.isExpanded,
      FolderMetadata.fromServerDTO(dto.metadata),
      dto.createdAt,
      dto.updatedAt,
      children,
    );
  }

  static fromPersistenceDTO(dto: FolderPersistenceDTO): Folder {
    return new Folder(
      dto.uuid,
      dto.repositoryUuid,
      dto.parentUuid ?? null,
      dto.name,
      dto.path,
      dto.order,
      dto.isExpanded,
      FolderMetadata.fromServerDTO(JSON.parse(dto.metadata)),
      dto.createdAt.getTime(),
      dto.updatedAt.getTime(),
      null,
    );
  }
}
