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

/** 内部状态接口 for NotificationHistory */
interface NotificationHistoryState {
  notificationId: NotificationId;
  action: string;
  details: unknown | null;
  createdAt: Date;
}

/**
 * NotificationHistory 实体
 */
export class NotificationHistory
  extends Entity<INotificationHistoryId>
  implements NotificationHistoryServer
{
  // ===== 私有属性容器 =====
  private _props: NotificationHistoryState;

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
    this._props = {
      notificationId: params.notificationId,
      action: params.action,
      details: params.details,
      createdAt: params.createdAt,
    };
  }

  // ===== Getter 属性 =====
  public get notificationId(): NotificationId {
    return this._props.notificationId;
  }

  public get action(): string {
    return this._props.action;
  }

  public get details(): unknown | null {
    return this._props.details;
  }

  public get createdAt(): Date {
    return this._props.createdAt;
  }

  // ===== 转换方法 =====

  public toServerDTO(): NotificationHistoryServerDTO {
    return {
      id: String(this.id) as INotificationHistoryId,
      notificationId: this._props.notificationId,
      action: this._props.action,
      details: this._props.details,
      createdAt: this._props.createdAt.getTime(),
    };
  }

  public toPersistenceDTO(): NotificationHistoryPersistenceDTO {
    return {
      id: String(this.id) as INotificationHistoryId,
      notificationId: this._props.notificationId,
      action: this._props.action,
      details: this._props.details ? JSON.stringify(this._props.details) : null,
      createdAt: this._props.createdAt,
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
