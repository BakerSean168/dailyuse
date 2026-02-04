/**
 * NotificationHistory 实体实现
 * 通知历史记录
 */

import { Entity } from '@dailyuse/utils';
import { NotificationHistoryId } from '@dailyuse/domain-shared/notification';
import type { NotificationId, NotificationHistoryId as INotificationHistoryId } from '@dailyuse/contracts/primitives';

// ============ 本地类型定义 ============
// TODO: 这些类型应该移到 @dailyuse/contracts/notification

/**
 * NotificationHistory Server DTO
 */
export interface NotificationHistoryServerDTO {
  id: INotificationHistoryId;
  notificationId: NotificationId;
  action: string;
  details: unknown | null;
  createdAt: number; // TransferDate
}

/**
 * NotificationHistory Persistence DTO
 */
export interface NotificationHistoryPersistenceDTO {
  id: INotificationHistoryId;
  notificationId: NotificationId;
  action: string;
  details: string | null; // JSON string
  createdAt: Date;
}

/**
 * NotificationHistory Server Interface
 */
export interface NotificationHistoryServer {
  readonly id: INotificationHistoryId;
  readonly notificationId: NotificationId;
  readonly action: string;
  readonly details: unknown | null;
  readonly createdAt: Date;

  toServerDTO(): NotificationHistoryServerDTO;
  toPersistenceDTO(): NotificationHistoryPersistenceDTO;
}

/**
 * NotificationHistory 实体
 */
export class NotificationHistory
  extends Entity<INotificationHistoryId>
  implements NotificationHistoryServer
{
  // ===== 私有字段 =====
  private _notificationId: NotificationId;
  private _action: string;
  private _details: unknown | null;
  private _createdAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(
    id: INotificationHistoryId,
    params: {
      notificationId: NotificationId;
      action: string;
      details: unknown | null;
      createdAt: Date;
    },
  ) {
    super(id);
    this._notificationId = params.notificationId;
    this._action = params.action;
    this._details = params.details;
    this._createdAt = params.createdAt;
  }

  // ===== Getter 属性 =====
  public get notificationId(): NotificationId {
    return this._notificationId;
  }

  public get action(): string {
    return this._action;
  }

  public get details(): unknown | null {
    return this._details;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationHistoryServerDTO {
    return {
      id: String(this.id) as INotificationHistoryId,
      notificationId: this._notificationId,
      action: this._action,
      details: this._details,
      createdAt: this._createdAt.getTime(),
    };
  }

  public toPersistenceDTO(): NotificationHistoryPersistenceDTO {
    return {
      id: String(this.id) as INotificationHistoryId,
      notificationId: this._notificationId,
      action: this._action,
      details: this._details ? JSON.stringify(this._details) : null,
      createdAt: this._createdAt,
    };
  }

  // ===== 静态工厂方法 =====

  public static create(params: {
    notificationId: NotificationId;
    action: string;
    details?: unknown;
  }): NotificationHistory {
    const id = NotificationHistoryId.of(NotificationHistoryId.generate());

    return new NotificationHistory(id, {
      notificationId: params.notificationId,
      action: params.action,
      details: params.details ?? null,
      createdAt: new Date(),
    });
  }

  public static fromServerDTO(dto: NotificationHistoryServerDTO): NotificationHistory {
    const id = NotificationHistoryId.of(dto.id);

    return new NotificationHistory(id, {
      notificationId: dto.notificationId,
      action: dto.action,
      details: dto.details,
      createdAt: new Date(dto.createdAt),
    });
  }

  public static fromPersistenceDTO(dto: NotificationHistoryPersistenceDTO): NotificationHistory {
    const id = NotificationHistoryId.of(dto.id);

    return new NotificationHistory(id, {
      notificationId: dto.notificationId,
      action: dto.action,
      details: dto.details ? JSON.parse(dto.details) : null,
      createdAt: dto.createdAt instanceof Date ? dto.createdAt : new Date(dto.createdAt),
    });
  }
}
