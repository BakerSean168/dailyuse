import type { Instant } from '@memoflow/contracts/primitives';
/**
 * GoalFolder 聚合根实现
 *
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念，代表一个业务边界：
 * - 唯一标识：通过 UUID 区分不同的聚合实例
 * - 事务边界：所有对聚合的修改在一个事务内完成
 * - 统一性：聚合保证内部状态的一致性
 * - 生命周期：聚合有创建、修改、删除的完整生命周期
 *
 * 【GoalFolder 职责】
 * 管理目标文件夹的完整生命周期：
 * - 文件夹属性管理（名称、描述、图标、颜色）
 * - 父子关系管理（层级结构）
 * - 系统文件夹保护（系统文件夹不能修改/删除）
 * - 软删除支持（保留历史记录）
 *
 * 【不变量（Invariants）】
 * 这些条件必须始终保持真：
 * - 系统文件夹不能被重命名或删除
 * - sortOrder >= 0
 * - 软删除后不能再修改属性（只能恢复）
 */

import { AggregateRoot } from '@memoflow/utils/domain';
import { IdentityId } from '@memoflow/domain-shared';
import { GoalFolderId } from '../value-objects';
import type { GoalEventMap } from '@memoflow/contracts/goal';
import type {
  FolderType,
  GoalFolderClientDTO,
  GoalFolderServerDTO,
} from '@memoflow/contracts/goal';

/**
 * GoalFolder 内部状态接口
 * 自包含的领域状态定义，不依赖外部 DTO 接口
 */
export interface GoalFolderState {
  id: GoalFolderId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  parentFolderId: GoalFolderId | null;
  sortOrder: number;
  isSystemFolder: boolean;
  folderType: FolderType | null;
  createdAt: Instant;
  updatedAt: Instant;
  deletedAt: Instant | null;
  version: number;
}

/**
 * GoalFolder 聚合根
 */
export class GoalFolder extends AggregateRoot<GoalFolderId> {
  // ================= 1. 内部状态 (Props) =================
  private _props: GoalFolderState;

  // ================= 2. 构造函数 (Private) =================
  /**
   * 【规范说明】
   * 构造函数必须为 private，防止外部直接 new GoalFolder(...)
   * 确保所有实例都通过工厂方法创建，保证业务规则验证
   *
   * id 由 AggregateRoot 基类管理，是 public readonly
   */
  private constructor(state: GoalFolderState) {
    super(state.id);
    this._props = { ...state };
  }

  // ================= 3. 公共属性 (Getters) =================
  /**
   * 【规范说明】
   * 通过 public get 暴露状态，但标记为只读
   * 确保外部只能读取，不能直接修改
   * 所有修改必须通过明确的业务方法进行
   *
   * 注意：id 已由 AggregateRoot 基类提供为 public readonly，无需重新定义
   */
  public get identityId(): IdentityId {
    return this._props.identityId;
  }

  public get name(): string {
    return this._props.name;
  }

  public get description(): string | null {
    return this._props.description;
  }

  public get icon(): string | null {
    return this._props.icon;
  }

  public get color(): string | null {
    return this._props.color;
  }

  public get parentFolderId(): GoalFolderId | null {
    return this._props.parentFolderId;
  }

  public get sortOrder(): number {
    return this._props.sortOrder;
  }

  public get isSystemFolder(): boolean {
    return this._props.isSystemFolder;
  }

  public get folderType(): FolderType | null {
    return this._props.folderType;
  }

  public get createdAt(): Instant {
    const v = this._props.createdAt;
    return v as Instant;
  }

  public get updatedAt(): Instant {
    const v = this._props.updatedAt;
    return v as Instant;
  }

  public get deletedAt(): Instant | null {
    const v = this._props.deletedAt;
    if (v == null) return null;
    return v as Instant;
  }

  public get version(): number {
    return this._props.version;
  }

  // ================= 4. 工厂方法 (Factory Methods) =================

  /**
   * 🏭 业务工厂：创建新的文件夹
   *
   * 【设计说明】
   * - 创建时自动生成 UUID
   * - 设置初始时间戳
   * - 发送领域事件
   * - 执行所有验证规则
   *
   * @param params 文件夹创建参数
   * @returns 新创建的 GoalFolder 聚合根
   * @throws 当必要参数缺失或验证失败时
   */
  public static create(params: {
    identityId: IdentityId;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    parentFolderId?: GoalFolderId;
    sortOrder?: number;
    isSystemFolder?: boolean;
    folderType?: FolderType;
  }): GoalFolder {
    // 验证业务规则
    if (!params.identityId) {
      throw new Error('Identity ID is required');
    }
    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    const now = Date.now();
    const id = GoalFolderId.generate();
    const folder = new GoalFolder({
      id,
      identityId: params.identityId,
      name: params.name.trim(),
      description: params.description?.trim() ?? null,
      icon: params.icon ?? null,
      color: params.color ?? null,
      parentFolderId: params.parentFolderId ?? null,
      sortOrder: params.sortOrder ?? 0,
      isSystemFolder: params.isSystemFolder ?? false,
      folderType: params.folderType ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      version: 1,
    });

    folder.addDomainEvent<GoalEventMap['goal:folder-created']>('goal:folder-created', {
      identityId: params.identityId,
      folderId: folder.id,
      folder: folder.toServerDTO(),
    });

    return folder;
  }

  /**
   * 🏭 恢复工厂：从领域状态恢复
   * 用于从持久化层或其他来源重建聚合根
   */
  public static load(state: GoalFolderState): GoalFolder {
    return new GoalFolder(state);
  }

  // ================= 5. 业务行为 (Business Methods) =================

  /**
   * ✅ 重命名文件夹
   *
   * 【业务规则】
   * - 名称不能为空
   * - 系统文件夹不能重命名（保护系统数据）
   * - 更新 updatedAt 时间戳
   * - 发送 "GoalFolderUpdated" 事件
   *
   * @param newName 新的文件夹名称
   * @throws 当文件夹是系统文件夹或名称为空时
   */
  public rename(newName: string): void {
    const trimmed = newName.trim();
    if (trimmed.length === 0) {
      throw new Error('Name cannot be empty');
    }
    if (this._props.isSystemFolder) {
      throw new Error('Cannot rename system folder');
    }

    this._props.name = trimmed;
    this._props.updatedAt = Date.now();

    this.emitUpdated(['name']);
  }

  /**
   * ✅ 更新描述
   */
  public updateDescription(description: string): void {
    this._props.description = description.trim() || null;
    this._props.updatedAt = Date.now();
    this.emitUpdated(['description']);
  }

  /**
   * ✅ 更新图标
   */
  public updateIcon(icon: string): void {
    this._props.icon = icon.trim() || null;
    this._props.updatedAt = Date.now();
    this.emitUpdated(['icon']);
  }

  /**
   * ✅ 更新颜色
   */
  public updateColor(color: string): void {
    this._props.color = color.trim() || null;
    this._props.updatedAt = Date.now();
    this.emitUpdated(['color']);
  }

  /**
   * ✅ 更新排序顺序
   *
   * 【业务规则】
   * - sortOrder 必须 >= 0
   */
  public updateSortOrder(sortOrder: number): void {
    if (sortOrder < 0) {
      throw new Error('Sort order cannot be negative');
    }
    this._props.sortOrder = sortOrder;
    this._props.updatedAt = Date.now();
    this.emitUpdated(['sortOrder']);
  }

  /**
   * ✅ 软删除
   *
   * 【设计说明】
   * - 不真正删除数据，只标记为已删除
   * - 系统文件夹不能删除
   * - 发送 "GoalFolderDeleted" 事件
   * - 幂等：重复删除不会报错
   */
  public softDelete(): void {
    if (this._props.deletedAt) return; // 幂等
    if (this._props.isSystemFolder) {
      throw new Error('Cannot delete system folder');
    }

    this._props.deletedAt = Date.now();
    this._props.updatedAt = this._props.deletedAt;

    this.addDomainEvent<GoalEventMap['goal:folder-deleted']>('goal:folder-deleted', {
      identityId: this._props.identityId,
      folderId: this.id,
      folder: this.toServerDTO(),
      isSoftDelete: true,
      deletedAt: this._props.deletedAt,
    });
  }

  /**
   * ✅ 恢复已删除的文件夹
   *
   * 【设计说明】
   * - 幂等：未删除的文件夹调用此方法无效果
   */
  public restore(): void {
    if (!this._props.deletedAt) return; // 幂等
    this._props.deletedAt = null;
    this._props.updatedAt = Date.now();
    this.emitUpdated(['deletedAt']);
  }

  /**
   * ✅ 移动到父文件夹
   */
  public moveToParent(parentFolderId: GoalFolderId | null): void {
    this._props.parentFolderId = parentFolderId;
    this._props.updatedAt = Date.now();
    this.emitUpdated(['parentFolderId']);
  }

  private emitUpdated(changes: string[]): void {
    this.addDomainEvent<GoalEventMap['goal:folder-updated']>('goal:folder-updated', {
      identityId: this._props.identityId,
      folderId: this.id,
      folder: this.toServerDTO(),
      changes,
    });
  }

  // ================= 6. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   *
   * 【用途】
   * - 应用服务返回数据给 API 层
   * - 跨层级传递数据
   *
   * 【时间戳处理】
   * - Server DTO 中时间戳使用 number (TransferDate)
   */
  public toServerDTO(): GoalFolderServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      icon: this._props.icon,
      color: this._props.color,
      parentFolderId: this._props.parentFolderId,
      sortOrder: this._props.sortOrder,
      isSystemFolder: this._props.isSystemFolder,
      folderType: this._props.folderType,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt ? this._props.deletedAt : null,
      version: this._props.version,
    };
  }

  /**
   * 转换为 Client DTO
   *
   * 【用途】
   * - 发送给前端客户端
   * - 包含 UI 计算字段（completionRate, activeGoalCount 等）
   *
   * 【时间戳处理】
   * - Client DTO 中时间戳使用 number (TransferDate)
   */
  public toClientDTO(): GoalFolderClientDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      icon: this._props.icon,
      color: this._props.color,
      parentFolderId: this._props.parentFolderId,
      sortOrder: this._props.sortOrder,
      isSystemFolder: this._props.isSystemFolder,
      folderType: this._props.folderType,
      version: this._props.version,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt ?? null,

      // UI 计算字段
      displayName: this._props.name,
      displayIcon: this._props.icon ?? 'default-folder-icon',
    };
  }
}
