/**
 * NotificationAction Value Object
 * 通知动作值对象
 */

import type { NotificationActionType } from './notification-action-type';

// ============ 接口定义 ============

/**
 * NotificationAction Server Interface
 */
export interface INotificationAction {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // 值对象方法
  with(
    updates: Partial<
      Omit<
        INotificationAction,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): INotificationAction;

  // DTO 转换方法
}

/**
 * NotificationAction Client Interface
 */
export interface INotificationActionClient {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;

  // UI 计算属性
  typeText: string; // "跳转", "API调用", "关闭", "回复"
  icon: string;

  // 值对象方法

  // DTO 转换方法
}

// ============ DTO 定义 ============

/**
 * NotificationAction DTO (Server)
 */
export interface NotificationActionDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;
}

/**
 * NotificationAction Client DTO
 */
export interface NotificationActionClientDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;
  typeText: string;
  icon: string;
}

/**
 * NotificationAction Persistence DTO
 */
export interface NotificationActionPersistenceDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload: string | null; // JSON string
}

// ============ 实现类型 ============

export type NotificationAction = INotificationAction;
export type NotificationActionClient = INotificationActionClient;

// ============ Backward Compatibility ============

/**
 * @deprecated Use NotificationActionDTO instead
 */
export type NotificationActionServerDTO = NotificationActionDTO;

/**
 * @deprecated Use INotificationAction instead
 */
export type INotificationActionServer = INotificationAction;

/**
 * @deprecated Use NotificationAction instead
 */
export type NotificationActionServer = NotificationAction;
