/**
 * NotificationHistory 实体实现
 * 通知历史记录
 */

import { Entity } from '@dailyuse/utils';
import { NotificationHistoryId } from '../../domain-shared/value-objects/notification-history-id';
import type {
  NotificationId,
  NotificationHistoryId as INotificationHistoryId,
} from '@dailyuse/contracts/primitives';

// ============ 本地类型定义 ============
// Kept local for now because these history DTOs are not yet shared across transports.

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
 * NotificationHistory Server Interface
 */
export interface NotificationHistoryServer {
  readonly id: INotificationHistoryId;
  readonly notificationId: NotificationId;
  readonly action: string;
  readonly details: unknown | null;
  readonly createdAt: Date;

  toServerDTO(): NotificationHistoryServerDTO;
}

/** 内部状态接口 for NotificationHistory */
export interface NotificationHistoryState {
  id: INotificationHistoryId;
  notificationId: NotificationId;
  action: string;
  details: unknown | null;
  createdAt: Date;
}

/**
 * NotificationHistory 实体
 */
export class NotificationHistory extends Entity<INotificationHistoryId> {
  // ===== 私有属性容器 =====
  private _props: NotificationHistoryState;

  // ===== 构造函数（私有） =====
  private constructor(state: NotificationHistoryState) {
    super(state.id);
    this._props = { ...state };
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
      id: this.id as INotificationHistoryId,
      notificationId: this._props.notificationId,
      action: this._props.action,
      details: this._props.details,
      createdAt: this._props.createdAt.getTime(),
    };
  }

  // ===== 静态工厂方法 =====

  public static load(state: NotificationHistoryState): NotificationHistory {
    return new NotificationHistory(state);
  }

  public static create(params: {
    notificationId: NotificationId;
    action: string;
    details?: unknown;
  }): NotificationHistory {
    const id = NotificationHistoryId.of(NotificationHistoryId.generate());

    return new NotificationHistory({
      id,
      notificationId: params.notificationId,
      action: params.action,
      details: params.details ?? null,
      createdAt: new Date(),
    });
  }
}
