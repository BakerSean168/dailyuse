/**
 * NotificationAction 值对象
 * 
 * 通知动作：用户可执行的操作按钮
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  NotificationAction as INotificationAction,
  NotificationActionDTO,
  NotificationActionPersistenceDTO,
  NotificationActionType,
} from '@dailyuse/contracts/notification';

/**
 * NotificationAction 值对象实现
 */
export class NotificationAction extends ValueObject<NotificationActionDTO> implements INotificationAction {

  private constructor(props: NotificationActionDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: NotificationActionDTO): NotificationAction {
    this.validate(props);
    return new NotificationAction(props);
  }

  public static of(
    id: string,
    label: string,
    type: NotificationActionType,
    payload?: unknown,
  ): NotificationAction {
    return NotificationAction.create({ id, label, type, payload });
  }

  public static fromDTO(dto: NotificationActionDTO): NotificationAction {
    return new NotificationAction(dto);
  }

  public static fromPersistenceDTO(dto: NotificationActionPersistenceDTO): NotificationAction {
    return new NotificationAction({
      id: dto.id,
      label: dto.label,
      type: dto.type,
      payload: dto.payload ? JSON.parse(dto.payload) : undefined,
    });
  }

  // ================= 校验 =================
  
  private static validate(props: NotificationActionDTO): void {
    if (!props.id || props.id.trim().length === 0) {
      throw new Error('Action ID is required');
    }
    if (!props.label || props.label.trim().length === 0) {
      throw new Error('Action label is required');
    }
  }

  // ================= Getters =================

  public get id(): string {
    return this.props.id;
  }

  public get label(): string {
    return this.props.label;
  }

  public get type(): NotificationActionType {
    return this.props.type;
  }

  public get payload(): unknown {
    return this.props.payload;
  }

  // ================= 序列化 =================

  public toDTO(): NotificationActionDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): NotificationActionPersistenceDTO {
    return {
      id: this.props.id,
      label: this.props.label,
      type: this.props.type,
      payload: this.props.payload ? JSON.stringify(this.props.payload) : null,
    };
  }
}
