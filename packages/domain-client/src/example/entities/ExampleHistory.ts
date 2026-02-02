/**
 * ExampleHistory 实体 - Client 端实现
 * 
 * 【规范说明：Client 端实体特点】
 * - 专注于 UI 展示和交互逻辑
 * - 提供丰富的 UI 辅助方法（displayXxx, formatXxx）
 * - 数据源是 API 响应（ClientDTO）
 * 
 * 【时间类型防腐层 - ACL（Anti-Corruption Layer）】
 * - TransferDate = number：API 响应中的时间字段
 * - DomainDate = Date：客户端内部存储，便于日期计算和格式化
 * 
 * 注意：Client 端不需要 PersistenceDate，因为不直接操作数据库
 * 
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils (Entity 基类)
 * - @dailyuse/contracts (DTO 定义)
 * - @dailyuse/domain-shared (值对象)
 * 
 * ❌ 禁止依赖：
 * - @dailyuse/domain-server（绝对禁止！）
 */

import { Entity } from '@dailyuse/utils';
import type { 
  TransferDate,
  DomainDate,
} from '@dailyuse/contracts/primitives';
import type { ExampleHistoryClientDTO } from '@dailyuse/contracts/example';

/**
 * 【基类 Entity 自带方法】
 * - uuid: string (readonly) - 实体唯一标识符
 * - _uuid: string (protected) - 内部 uuid 存储
 * - static generateUUID(): string - 生成新的 UUID
 */
export class ExampleHistory extends Entity {
  // ================= 1. 内部状态 =================
  /**
   * 【规范说明：Client 端时间存储】
   * 
   * Client 端内部也使用 DomainDate（Date）存储
   * 便于进行日期格式化、相对时间计算等 UI 操作
   */
  private _exampleId: string;
  private _action: ExampleHistoryActionClient;
  private _changes: Record<string, unknown> | null;
  private _performedBy: string;
  private _createdAt: DomainDate; // ✅ 内部使用 Date 便于格式化

  // ================= 2. 构造函数（Private）=================
  private constructor(params: {
    uuid: string;
    exampleId: string;
    action: ExampleHistoryActionClient;
    changes: Record<string, unknown> | null;
    performedBy: string;
    createdAt: DomainDate;
  }) {
    super(params.uuid);
    this._exampleId = params.exampleId;
    this._action = params.action;
    this._changes = params.changes;
    this._performedBy = params.performedBy;
    this._createdAt = params.createdAt;
  }

  // ================= 3. 工厂方法 =================

  /**
   * 从 ClientDTO 恢复（主要工厂方法）
   * 
   * 【规范说明：TransferDate → DomainDate 转换】
   * API 返回的是 TransferDate（number），需要转为 Date 存储
   */
  public static fromClientDTO(dto: ExampleHistoryClientDTO): ExampleHistory {
    return new ExampleHistory({
      uuid: dto.uuid,
      exampleId: dto.exampleId,
      action: dto.action as ExampleHistoryActionClient,
      changes: dto.changes,
      performedBy: dto.performedBy,
      createdAt: new Date(dto.createdAt), // ✅ TransferDate → DomainDate
    });
  }

  /**
   * ❌ Client 端不需要 create() 工厂
   * 历史记录由服务端创建，客户端只负责展示
   */

  // ================= 4. 基础 Getters =================
  
  public override get uuid(): string {
    return this._uuid;
  }

  get exampleId(): string { 
    return this._exampleId; 
  }

  get action(): ExampleHistoryActionClient { 
    return this._action; 
  }

  get changes(): Record<string, unknown> | null { 
    return this._changes ? { ...this._changes } : null; 
  }

  get performedBy(): string { 
    return this._performedBy; 
  }

  get createdAt(): DomainDate { 
    return this._createdAt; 
  }

  // ================= 5. UI 辅助 Getters（View Model 逻辑）=================

  /**
   * ✨ 操作类型的本地化显示文本
   */
  get displayAction(): string {
    const actionLabels: Record<ExampleHistoryActionClient, string> = {
      Created: '创建',
      Updated: '更新',
      Activated: '发布',
      Archived: '归档',
      Deleted: '删除',
      TagAdded: '添加标签',
      TagRemoved: '移除标签',
    };
    return actionLabels[this._action] ?? this._action;
  }

  /**
   * ✨ 操作图标
   */
  get actionIcon(): string {
    const iconMap: Record<ExampleHistoryActionClient, string> = {
      Created: '➕',
      Updated: '✏️',
      Activated: '🚀',
      Archived: '📦',
      Deleted: '🗑️',
      TagAdded: '🏷️',
      TagRemoved: '🏷️',
    };
    return iconMap[this._action] ?? '📝';
  }

  /**
   * ✨ 操作颜色（用于 UI 高亮）
   */
  get actionColor(): string {
    const colorMap: Record<ExampleHistoryActionClient, string> = {
      Created: 'green',
      Updated: 'blue',
      Activated: 'purple',
      Archived: 'gray',
      Deleted: 'red',
      TagAdded: 'cyan',
      TagRemoved: 'orange',
    };
    return colorMap[this._action] ?? 'default';
  }

  /**
   * ✨ 是否有变更详情
   */
  get hasChanges(): boolean {
    return this._changes !== null && Object.keys(this._changes).length > 0;
  }

  /**
   * ✨ 变更摘要（用于列表展示）
   */
  get changesSummary(): string | null {
    if (!this.hasChanges) return null;

    const fieldLabels: Record<string, string> = {
      name: '名称',
      description: '描述',
      priority: '优先级',
      status: '状态',
      isPublic: '公开状态',
    };

    const changedFields = Object.keys(this._changes!)
      .map(key => fieldLabels[key] ?? key)
      .join('、');

    return `修改了 ${changedFields}`;
  }

  /**
   * ✨ 格式化创建时间（本地化）
   */
  get formattedCreatedAt(): string {
    return this._createdAt.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * ✨ 相对时间（如"5分钟前"）
   */
  get relativeCreatedAt(): string {
    const now = Date.now();
    const diff = now - this._createdAt.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}个月前`;
    return `${Math.floor(days / 365)}年前`;
  }

  /**
   * ✨ 完整显示文本（用于时间线）
   */
  get displayText(): string {
    return `${this.actionIcon} ${this.displayAction} - ${this.relativeCreatedAt}`;
  }

  // ================= 6. 序列化 =================

  /**
   * 转换为 ClientDTO
   * 
   * 【规范说明：DomainDate → TransferDate 转换】
   * 序列化时将 Date 转回 number
   */
  public toClientDTO(): ExampleHistoryClientDTO {
    return {
      uuid: this.uuid,
      exampleId: this._exampleId,
      action: this._action,
      changes: this._changes,
      performedBy: this._performedBy,
      createdAt: this._createdAt.getTime(), // ✅ DomainDate → TransferDate
    };
  }
}

// ================= 相关类型定义 =================

/**
 * 历史操作类型枚举（Client 端）
 */
export const ExampleHistoryActionClient = {
  Created: 'Created',
  Updated: 'Updated',
  Activated: 'Activated',
  Archived: 'Archived',
  Deleted: 'Deleted',
  TagAdded: 'TagAdded',
  TagRemoved: 'TagRemoved',
} as const;

export type ExampleHistoryActionClient = typeof ExampleHistoryActionClient[keyof typeof ExampleHistoryActionClient];
