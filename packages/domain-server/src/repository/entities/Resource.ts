/**
 * Resource Entity - Server Implementation
 * 资源实体 - 服务端实现
 */
import type {
  ResourceClientDTO,
  ResourceMetadataServerDTO,
  ResourcePersistenceDTO,
  ResourceServer,
  ResourceServerDTO,
  ResourceStatsServerDTO,
} from '@dailyuse/contracts/repository';
import { ResourceStatus, ResourceType } from '@dailyuse/contracts/repository';
import { ResourceMetadata } from '../value-objects/ResourceMetadata';
import { ResourceStats } from '../value-objects/ResourceStats';

export class Resource implements ResourceServer {
  private _uuid: string;
  private _repositoryUuid: string;
  private _folderUuid?: string | null;
  private _name: string;
  private _type: ResourceType;
  private _path: string;
  private _size: number;
  private _content?: string | null;
  private _metadata: ResourceMetadata;
  private _stats: ResourceStats;
  private _status: ResourceStatus;
  private _createdAt: number;
  private _updatedAt: number;

  private constructor(params: {
    uuid: string;
    repositoryUuid: string;
    name: string;
    type: ResourceType;
    path: string;
    size: number;
    folderUuid?: string | null;
    content?: string | null;
    metadata: ResourceMetadata;
    stats: ResourceStats;
    status: ResourceStatus;
    createdAt: number;
    updatedAt: number;
  }) {
    this._uuid = params.uuid;
    this._repositoryUuid = params.repositoryUuid;
    this._folderUuid = params.folderUuid ?? null;
    this._name = params.name;
    this._type = params.type;
    this._path = params.path;
    this._size = params.size;
    this._content = params.content ?? null;
    this._metadata = params.metadata;
    this._stats = params.stats;
    this._status = params.status;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getters =====
  get uuid(): string {
    return this._uuid;
  }

  get repositoryUuid(): string {
    return this._repositoryUuid;
  }

  get folderUuid(): string | null | undefined {
    return this._folderUuid;
  }

  get name(): string {
    return this._name;
  }

  get type(): ResourceType {
    return this._type;
  }

  get path(): string {
    return this._path;
  }

  get size(): number {
    return this._size;
  }

  get content(): string | null | undefined {
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

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 内容操作方法 =====
  updateMarkdownContent(content: string): void {
    this._content = content;
    this._updatedAt = Date.now();
    this._stats.incrementEditCount();

    // 更新字数统计
    const wordCount = this.calculateWordCount(content);
    const readingTime = Math.ceil(wordCount / 200); // 假设每分钟 200 字
    this._metadata = ResourceMetadata.create({
      ...this._metadata.toServerDTO(),
      wordCount,
      readingTime,
    });
  }

  getMarkdownContent(): string {
    return this._content ?? '';
  }

  clearContent(): void {
    this._content = null;
    this._updatedAt = Date.now();
  }

  // ===== 元数据方法 =====
  updateMetadata(newMetadata: Partial<ResourceMetadataServerDTO>): void {
    this._metadata = ResourceMetadata.create({
      ...this._metadata.toServerDTO(),
      ...newMetadata,
    });
    this._updatedAt = Date.now();
  }

  updateStats(newStats: Partial<ResourceStatsServerDTO>): void {
    this._stats = ResourceStats.create({
      ...this._stats.toServerDTO(),
      ...newStats,
    });
    this._updatedAt = Date.now();
  }

  // ===== 状态管理 =====
  archive(): void {
    this._status = ResourceStatus.ARCHIVED;
    this._updatedAt = Date.now();
  }

  activate(): void {
    this._status = ResourceStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  delete(): void {
    this._status = ResourceStatus.DELETED;
    this._updatedAt = Date.now();
  }

  moveTo(folderUuid: string | null): void {
    this._folderUuid = folderUuid;
    this._updatedAt = Date.now();
  }

  /**
   * 记录访问时间
   */
  recordAccess(): void {
    this._stats.incrementViewCount();
    this._updatedAt = Date.now();
  }

  /**
   * 检查是否可以编辑
   */
  canEdit(): boolean {
    return this._status !== ResourceStatus.DELETED && this._status !== ResourceStatus.ARCHIVED;
  }

  /**
   * 更新资源名称
   */
  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Resource name cannot be empty');
    }
    this._name = name.trim();
    this._updatedAt = Date.now();
  }

  /**
   * 更新资源描述
   */
  updateDescription(description: string | null): void {
    this._metadata = ResourceMetadata.create({
      ...this._metadata.toServerDTO(),
      description,
    });
    this._updatedAt = Date.now();
  }

  /**
   * 设置资源分类
   */
  setCategory(category: string): void {
    this._metadata = ResourceMetadata.create({
      ...this._metadata.toServerDTO(),
      category,
    });
    this._updatedAt = Date.now();
  }

  /**
   * 添加标签
   */
  addTag(tag: string): void {
    const metadataDTO = this._metadata.toServerDTO();
    const currentTags: string[] = Array.isArray(metadataDTO.tags) ? metadataDTO.tags : [];
    if (!currentTags.includes(tag)) {
      this._metadata = ResourceMetadata.create({
        ...metadataDTO,
        tags: [...currentTags, tag],
      });
      this._updatedAt = Date.now();
    }
  }

  /**
   * 软删除
   */
  softDelete(): void {
    this._status = ResourceStatus.DELETED;
    this._updatedAt = Date.now();
  }

  /**
   * 检查是否为 Markdown 资源
   */
  isMarkdown(): boolean {
    return this._type === ResourceType.MARKDOWN;
  }

  /**
   * 切换收藏状态
   */
  toggleFavorite(): void {
    const metadataDTO = this._metadata.toServerDTO();
    const isFavorite = metadataDTO.isFavorite ?? false;
    this._metadata = ResourceMetadata.create({
      ...metadataDTO,
      isFavorite: !isFavorite,
    });
    this._updatedAt = Date.now();
  }

  /**
   * 发布资源（从草稿变为激活状态）
   */
  publish(): void {
    if (this._status !== ResourceStatus.DRAFT) {
      throw new Error('Only draft resources can be published');
    }
    this._status = ResourceStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  // ===== 私有辅助方法 =====
  private calculateWordCount(content: string): number {
    // 移除 Markdown 语法，计算纯文本字数
    const plainText = content
      .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
      .replace(/\[.*?\]\(.*?\)/g, '$1') // 移除链接，保留文本
      .replace(/[#*`~_\-]/g, '') // 移除 Markdown 符号
      .trim();

    // 中文字符计数
    const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 英文单词计数
    const englishWords = plainText
      .replace(/[\u4e00-\u9fa5]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 0).length;

    return chineseChars + englishWords;
  }

  // ===== DTO 转换方法 =====
  toServerDTO(): ResourceServerDTO {
    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      folderUuid: this._folderUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      size: this._size,
      content: this._content,
      metadata: this._metadata.toServerDTO(),
      stats: this._stats.toServerDTO(),
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  toClientDTO(): ResourceClientDTO {
    // 状态判断
    const isDeleted = this._status === ResourceStatus.DELETED;
    const isArchived = this._status === ResourceStatus.ARCHIVED;
    const isActive = this._status === ResourceStatus.ACTIVE;
    const isDraft = this._status === ResourceStatus.DRAFT;

    // 状态文本
    const statusText = isDeleted
      ? 'Deleted'
      : isArchived
        ? 'Archived'
        : isActive
          ? 'Active'
          : 'Draft';

    // 类型文本
    const typeText =
      this._type === ResourceType.MARKDOWN
        ? 'Markdown'
        : this._type === ResourceType.CODE
          ? 'Code'
          : this._type === ResourceType.IMAGE
            ? 'Image'
            : this._type === ResourceType.VIDEO
              ? 'Video'
              : this._type === ResourceType.AUDIO
                ? 'Audio'
                : this._type === ResourceType.PDF
                  ? 'PDF'
                  : this._type === ResourceType.LINK
                    ? 'Link'
                    : 'Other';

    // 显示名称（截断过长的名称）
    const displayName = this._name.length > 50 ? this._name.substring(0, 47) + '...' : this._name;

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

    // 文件扩展名
    const extension = this._name.includes('.') ? '.' + this._name.split('.').pop() : '';

    // 图标（根据类型）
    const icon =
      this._type === ResourceType.MARKDOWN
        ? 'description'
        : this._type === ResourceType.CODE
          ? 'code'
          : this._type === ResourceType.IMAGE
            ? 'image'
            : this._type === ResourceType.VIDEO
              ? 'movie'
              : this._type === ResourceType.AUDIO
                ? 'audiotrack'
                : this._type === ResourceType.PDF
                  ? 'picture_as_pdf'
                  : this._type === ResourceType.LINK
                    ? 'link'
                    : 'insert_drive_file';

    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      folderUuid: this._folderUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      size: this._size,
      content: this._content,
      metadata: this._metadata.toServerDTO() as any, // TODO: 待 metadata 实现 toClientDTO
      stats: this._stats.toServerDTO() as any, // TODO: 待 stats 实现 toClientDTO
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,

      // UI 计算字段
      isDeleted,
      isArchived,
      isActive,
      isDraft,
      statusText,
      typeText,
      displayName,
      formattedSize: formatSize(this._size),
      createdAtText: formattedCreatedAt,
      updatedAtText: formattedUpdatedAt,
      extension,
      icon,
    };
  }

  toPersistenceDTO(): ResourcePersistenceDTO {
    return {
      uuid: this._uuid,
      repositoryUuid: this._repositoryUuid,
      folderUuid: this._folderUuid,
      name: this._name,
      type: this._type,
      path: this._path,
      size: this._size,
      content: this._content,
      metadata: JSON.stringify(this._metadata.toServerDTO()),
      stats: JSON.stringify(this._stats.toServerDTO()),
      status: this._status,
      createdAt: new Date(this._createdAt),
      updatedAt: new Date(this._updatedAt),
    };
  }

  // ===== 静态工厂方法 =====
  static create(params: {
    uuid: string;
    repositoryUuid: string;
    name: string;
    type: ResourceType;
    path: string;
    folderUuid?: string | null;
    content?: string;
    metadata?: Partial<ResourceMetadataServerDTO>;
    stats?: Partial<ResourceStatsServerDTO>;
  }): Resource {
    const now = Date.now();
    return new Resource({
      uuid: params.uuid,
      repositoryUuid: params.repositoryUuid,
      name: params.name,
      type: params.type,
      path: params.path,
      size: params.content?.length || 0,
      folderUuid: params.folderUuid,
      content: params.content,
      metadata: ResourceMetadata.create(params.metadata),
      stats: ResourceStats.create(params.stats),
      status: ResourceStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromServerDTO(dto: ResourceServerDTO): Resource {
    return new Resource({
      uuid: dto.uuid,
      repositoryUuid: dto.repositoryUuid,
      folderUuid: dto.folderUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      size: dto.size,
      content: dto.content,
      metadata: ResourceMetadata.fromServerDTO(dto.metadata),
      stats: ResourceStats.fromServerDTO(dto.stats),
      status: dto.status,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  static fromPersistenceDTO(dto: ResourcePersistenceDTO): Resource {
    return new Resource({
      uuid: dto.uuid,
      repositoryUuid: dto.repositoryUuid,
      folderUuid: dto.folderUuid,
      name: dto.name,
      type: dto.type,
      path: dto.path,
      size: dto.size,
      content: dto.content,
      metadata: ResourceMetadata.fromServerDTO(
        JSON.parse(dto.metadata) as ResourceMetadataServerDTO,
      ),
      stats: ResourceStats.fromServerDTO(JSON.parse(dto.stats) as ResourceStatsServerDTO),
      status: dto.status,
      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
    });
  }
}
