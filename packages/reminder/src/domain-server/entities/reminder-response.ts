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
import { ReminderResponseId } from '../../domain-shared/value-objects/reminder-response-id';

/**
 * ReminderResponse 内部状态接口
 */
interface ReminderResponseState {
  id: ReminderResponseId;
  reminderTemplateId: string;
  action: ReminderResponseAction;
  responseTime: Date | null;
  timestamp: Date;
}

/**
 * ReminderResponse 实体
 *
 * DDD 实体特点：
 * - 有唯一标识符（uuid）
 * - 有生命周期
 * - 记录用户对提醒的响应行为
 * - 用于计算提醒效果指标
 */
export class ReminderResponse extends Entity<ReminderResponseId> implements ReminderResponseServer {
  // ===== 私有字段 =====
  private _props: ReminderResponseState;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    id?: string;
    reminderTemplateId: string;
    action: ReminderResponseAction;
    responseTime?: number | null;
    timestamp: number;
  }) {
    const id = params.id ? ReminderResponseId.of(params.id) : ReminderResponseId.generate();
    super(id);
    this._props = {
      id,
      reminderTemplateId: params.reminderTemplateId,
      action: params.action,
      responseTime: params.responseTime != null ? new Date(params.responseTime) : null,
      timestamp: new Date(params.timestamp),
    };
  }

  // ===== Getter 属性 =====


  public get reminderTemplateId(): string {
    return this._props.reminderTemplateId;
  }

  public get action(): ReminderResponseAction {
    return this._props.action;
  }

  public get responseTime(): Date | null {
    return this._props.responseTime;
  }

  public get timestamp(): Date {
    return this._props.timestamp;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 ReminderResponse 实体
   */
  public static create(params: {
    reminderTemplateId: string;
    action: ReminderResponseAction;
    responseTime?: number;
    timestamp?: number;
  }): ReminderResponse {
    return new ReminderResponse({
      reminderTemplateId: params.reminderTemplateId,
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
      id: dto.id,
      reminderTemplateId: dto.reminderTemplateId,
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
      id: dto.id,
      reminderTemplateId: dto.reminderTemplateId,
      action: dto.action,
      responseTime: dto.responseTime?.getTime() ?? null,
      timestamp: dto.timestamp.getTime(),
    });
  }

  // ===== 业务方法 =====

  /**
   * 是否点击
   */
  public isClicked(): boolean {
    return this._props.action === 'CLICKED';
  }

  /**
   * 是否忽略
   */
  public isIgnored(): boolean {
    return this._props.action === 'IGNORED';
  }

  /**
   * 是否延迟
   */
  public isSnoozed(): boolean {
    return this._props.action === 'SNOOZED';
  }

  /**
   * 是否关闭
   */
  public isDismissed(): boolean {
    return this._props.action === 'DISMISSED';
  }

  /**
   * 是否完成
   */
  public isCompleted(): boolean {
    return this._props.action === 'COMPLETED';
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
    switch (this._props.action) {
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
      id: this.id,
      reminderTemplateId: this._props.reminderTemplateId,
      action: this._props.action,
      responseTime: this._props.responseTime?.getTime() ?? null,
      timestamp: this._props.timestamp.getTime(),
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

    const actionText = actionTextMap[this._props.action];

    // 响应时间文本
    let responseTimeText: string | undefined = undefined;
    const responseTimeSec = this._props.responseTime ? Math.floor(this._props.responseTime.getTime() / 1000) : null;
    if (responseTimeSec !== null) {
      if (responseTimeSec < 60) {
        responseTimeText = `${responseTimeSec}秒后响应`;
      } else if (responseTimeSec < 3600) {
        responseTimeText = `${Math.round(responseTimeSec / 60)}分钟后响应`;
      } else {
        responseTimeText = `${Math.round(responseTimeSec / 3600)}小时后响应`;
      }
    }

    return {
      id: this.id,
      reminderTemplateId: this._props.reminderTemplateId,
      action: this._props.action,
      responseTime: this._props.responseTime?.getTime() ?? null,
      timestamp: this._props.timestamp.getTime(),
      actionText,
      responseTimeText,
    };
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): ReminderResponsePersistenceDTO {
    return {
      id: this.id,
      reminderTemplateId: this._props.reminderTemplateId,
      action: this._props.action,
      responseTime: this._props.responseTime,
      timestamp: this._props.timestamp,
    };
  }
}
