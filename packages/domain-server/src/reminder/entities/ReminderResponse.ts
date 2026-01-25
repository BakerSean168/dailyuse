/**
 * Reminder Response 实体
 * 提醒响应记录实体
 */

import type {
  ReminderResponseServer,
  ReminderResponseServerDTO,
  ReminderResponseClientDTO,
  ReminderResponsePersistenceDTO,
  ReminderResponseAction,
} from '@dailyuse/contracts/reminder';
import { Entity } from '@dailyuse/utils';

/**
 * ReminderResponse 实体
 *
 * DDD 实体特点：
 * - 有唯一标识符（uuid）
 * - 有生命周期
 * - 记录用户对提醒的响应行为
 * - 用于计算提醒效果指标
 */
export class ReminderResponse extends Entity implements ReminderResponseServer {
  // ===== 私有字段 =====
  private _reminderTemplateUuid: string;
  private _action: ReminderResponseAction;
  private _responseTime: number | null;
  private _timestamp: number;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    reminderTemplateUuid: string;
    action: ReminderResponseAction;
    responseTime?: number | null;
    timestamp: number;
  }) {
    super(params.uuid || Entity.generateUUID());
    this._reminderTemplateUuid = params.reminderTemplateUuid;
    this._action = params.action;
    this._responseTime = params.responseTime ?? null;
    this._timestamp = params.timestamp;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }

  public get reminderTemplateUuid(): string {
    return this._reminderTemplateUuid;
  }

  public get action(): ReminderResponseAction {
    return this._action;
  }

  public get responseTime(): number | null {
    return this._responseTime;
  }

  public get timestamp(): number {
    return this._timestamp;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 ReminderResponse 实体
   */
  public static create(params: {
    reminderTemplateUuid: string;
    action: ReminderResponseAction;
    responseTime?: number;
    timestamp?: number;
  }): ReminderResponse {
    return new ReminderResponse({
      reminderTemplateUuid: params.reminderTemplateUuid,
      action: params.action,
      responseTime: params.responseTime,
      timestamp: params.timestamp ?? Date.now(),
    });
  }

  /**
   * 从 Server DTO 创建实体
   */
  public static fromServerDTO(dto: ReminderResponseServerDTO): ReminderResponse {
    return new ReminderResponse({
      uuid: dto.uuid,
      reminderTemplateUuid: dto.reminderTemplateUuid,
      action: dto.action,
      responseTime: dto.responseTime,
      timestamp: dto.timestamp,
    });
  }

  /**
   * 从 Persistence DTO 创建实体
   */
  public static fromPersistenceDTO(dto: ReminderResponsePersistenceDTO): ReminderResponse {
    return new ReminderResponse({
      uuid: dto.uuid,
      reminderTemplateUuid: dto.reminderTemplateUuid,
      action: dto.action,
      responseTime: dto.responseTime,
      timestamp: dto.timestamp.getTime(),
    });
  }

  // ===== 业务方法 =====

  /**
   * 是否点击
   */
  public isClicked(): boolean {
    return this._action === 'CLICKED';
  }

  /**
   * 是否忽略
   */
  public isIgnored(): boolean {
    return this._action === 'IGNORED';
  }

  /**
   * 是否延迟
   */
  public isSnoozed(): boolean {
    return this._action === 'SNOOZED';
  }

  /**
   * 是否关闭
   */
  public isDismissed(): boolean {
    return this._action === 'DISMISSED';
  }

  /**
   * 是否完成
   */
  public isCompleted(): boolean {
    return this._action === 'COMPLETED';
  }

  /**
   * 是否正面响应（CLICKED 或 COMPLETED）
   */
  public isPositiveResponse(): boolean {
    return this.isClicked() || this.isCompleted();
  }

  /**
   * 是否负面响应（IGNORED 或 DISMISSED）
   */
  public isNegativeResponse(): boolean {
    return this.isIgnored() || this.isDismissed();
  }

  /**
   * 获取响应权重
   * COMPLETED(1.5), CLICKED(1.0), SNOOZED(-0.2), DISMISSED(-0.3), IGNORED(-0.5)
   */
  public getResponseWeight(): number {
    switch (this._action) {
      case 'COMPLETED':
        return 1.5;
      case 'CLICKED':
        return 1.0;
      case 'SNOOZED':
        return -0.2;
      case 'DISMISSED':
        return -0.3;
      case 'IGNORED':
        return -0.5;
      default:
        return 0;
    }
  }

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ReminderResponseServerDTO {
    return {
      uuid: this._uuid,
      reminderTemplateUuid: this._reminderTemplateUuid,
      action: this._action,
      responseTime: this._responseTime,
      timestamp: this._timestamp,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ReminderResponseClientDTO {
    // 动作文本映射
    const actionTextMap: Record<ReminderResponseAction, string> = {
      CLICKED: '点击',
      IGNORED: '忽略',
      SNOOZED: '延迟',
      DISMISSED: '关闭',
      COMPLETED: '完成',
    };

    const actionText = actionTextMap[this._action];

    // 响应时间文本
    let responseTimeText: string | undefined = undefined;
    if (this._responseTime !== null) {
      if (this._responseTime < 60) {
        responseTimeText = `${this._responseTime}秒后响应`;
      } else if (this._responseTime < 3600) {
        responseTimeText = `${Math.round(this._responseTime / 60)}分钟后响应`;
      } else {
        responseTimeText = `${Math.round(this._responseTime / 3600)}小时后响应`;
      }
    }

    return {
      uuid: this._uuid,
      reminderTemplateUuid: this._reminderTemplateUuid,
      action: this._action,
      responseTime: this._responseTime,
      timestamp: this._timestamp,
      actionText,
      responseTimeText,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): ReminderResponsePersistenceDTO {
    return {
      uuid: this._uuid,
      reminderTemplateUuid: this._reminderTemplateUuid,
      action: this._action,
      responseTime: this._responseTime,
      timestamp: new Date(this._timestamp),
    };
  }
}
