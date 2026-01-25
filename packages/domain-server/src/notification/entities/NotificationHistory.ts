/**
 * NotificationHistory 实体实现
 * 实现 NotificationHistoryServer 接口
 */

import type { NotificationHistoryPersistenceDTO, NotificationHistoryServer, NotificationHistoryServerDTO } from '@dailyuse/contracts/notification';
import { Entity } from '@dailyuse/utils';

/**
 * NotificationHistory 实体
 */
export class NotificationHistory extends Entity implements NotificationHistoryServer {
  // ===== 私有字段 =====
  private _notificationUuid: string;
  private _action: string;
  private _details: any | null;
  private _createdAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    notificationUuid: string;
    action: string;
    details?: any | null;
    createdAt: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._notificationUuid = params.notificationUuid;
    this._action = params.action;
    this._details = params.details ?? null;
    this._createdAt = params.createdAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get notificationUuid(): string {
    return this._notificationUuid;
  }
  public get action(): string {
    return this._action;
  }
  public get details(): any | null {
    return this._details;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }

  // ===== 业务方法 =====

  /**
   * 获取所属通知（需要通过仓储查询）
   */
  public async getNotification(): Promise<any> {
    throw new Error('需要通过 NotificationRepository 实现');
  }

  // ===== 转换方法 =====

  /**
   * 转换为 ServerDTO
   */
  public toServerDTO(): NotificationHistoryServerDTO {
    return {
      uuid: this.uuid,
      notificationUuid: this.notificationUuid,
      action: this.action,
      details: this.details,
      createdAt: this.createdAt,
    };
  }

  /**
   * 转换为 PersistenceDTO
   */
  public toPersistenceDTO(): NotificationHistoryPersistenceDTO {
    return {
      uuid: this.uuid,
      notificationUuid: this.notificationUuid,
      action: this.action,
      details: this.details ? JSON.stringify(this.details) : null,
      createdAt: this.createdAt,
    };
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新的 NotificationHistory 实体
   */
  public static create(params: {
    notificationUuid: string;
    action: string;
    details?: any;
  }): NotificationHistory {
    return new NotificationHistory({
      notificationUuid: params.notificationUuid,
      action: params.action,
      details: params.details,
      createdAt: new Date(),
    });
  }

  /**
   * 从 ServerDTO 创建实体
   */
  public static fromServerDTO(dto: NotificationHistoryServerDTO): NotificationHistory {
    return new NotificationHistory({
      uuid: dto.uuid,
      notificationUuid: dto.notificationUuid,
      action: dto.action,
      details: dto.details,
      createdAt: new Date(dto.createdAt),
    });
  }

  /**
   * 从 PersistenceDTO 创建实体
   */
  public static fromPersistenceDTO(dto: NotificationHistoryPersistenceDTO): NotificationHistory {
    return new NotificationHistory({
      uuid: dto.uuid,
      notificationUuid: dto.notificationUuid,
      action: dto.action,
      details: dto.details ? JSON.parse(dto.details) : null,
      createdAt: new Date(dto.createdAt),
    });
  }
}
