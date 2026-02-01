/**
 * NotificationAction Value Object
 * 通知动作值对象
 */

import type { NotificationActionType } from './notification-action-type';

// ============ 接口定义 ============

/**
 * NotificationAction 接口
 */
export interface NotificationAction {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;
}

// ============ DTO 定义 ============

/**
 * NotificationAction DTO (传输层)
 */
export interface NotificationActionDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload?: any;
}

/**
 * NotificationAction Persistence DTO (持久层)
 */
export interface NotificationActionPersistenceDTO {
  id: string;
  label: string;
  type: NotificationActionType;
  payload: string | null; // JSON string
}

