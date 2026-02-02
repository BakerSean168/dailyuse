/**
 * Resource Bookmark Entity
 * 资源书签领域实体 - Repository 模块的子实体
 * 
 * 设计目标：
 * - 轻量、高效、与资源紧向绑定
 * - 作为用户对 Resource 的一种"标记"或"别名"
 * - 完全由 Repository 模块管理（不跨模块）
 */

export class ResourceBookmark {
  private readonly _id: string;
  private readonly _resourceId: string;
  private readonly _identityId: string;
  private _aliasName: string | null;
  private _icon: string | null;
  private _color: string | null;
  private _sortOrder: number;
  private readonly _createdAt: Date;

  constructor(
    id: string,
    resourceId: string,
    identityId: string,
    aliasName: string | null,
    icon: string | null,
    color: string | null,
    sortOrder: number,
    createdAt: Date
  ) {
    this._id = id;
    this._resourceId = resourceId;
    this._identityId = identityId;
    this._aliasName = aliasName;
    this._icon = icon;
    this._color = color;
    this._sortOrder = sortOrder;
    this._createdAt = createdAt;
  }

  // ============ 访问器 ============

  get id(): string {
    return this._id;
  }

  get resourceId(): string {
    return this._resourceId;
  }

  get identityId(): string {
    return this._identityId;
  }

  get aliasName(): string | null {
    return this._aliasName;
  }

  get icon(): string | null {
    return this._icon;
  }

  get color(): string | null {
    return this._color;
  }

  get sortOrder(): number {
    return this._sortOrder;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // ============ 业务行为 ============

  /**
   * 修改别名
   * 如果传入 null，则恢复使用资源的原名
   */
  public rename(newName: string | null): void {
    if (newName !== null && newName.trim() === '') {
      throw new Error('Alias name cannot be empty string');
    }
    this._aliasName = newName;
  }

  /**
   * 更新外观（图标和颜色）
   */
  public updateAppearance(icon: string | null, color: string | null): void {
    this._icon = icon;
    this._color = color;
  }

  /**
   * 更新排序位置
   */
  public updateSortOrder(order: number): void {
    if (order < 0) {
      throw new Error('Sort order cannot be negative');
    }
    this._sortOrder = order;
  }

  /**
   * 获取显示名称
   * 如果有别名，使用别名；否则需要从关联的 Resource 获取原名
   */
  public getDisplayName(resourceName: string): string {
    return this._aliasName || resourceName;
  }
}
