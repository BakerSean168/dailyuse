/**
 * NotificationTemplate Aggregate Root - Client Interface
 * 通知模板聚合根 - 客户端接口
 */

import type { NotificationType, NotificationCategory } from '../value-objects';
import type { NotificationTemplateAggregateServerDTO } from './notification-template-server';
import type {
  NotificationTemplateConfigClient,
  NotificationTemplateConfigClientDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * NotificationTemplate Client DTO (聚合根级别)
 */
export interface NotificationTemplateAggregateClientDTO {
  uuid: string;
  name: string;
  description?: string | null;
  type: NotificationType;
  category: NotificationCategory;
  template: NotificationTemplateConfigClientDTO;
  isActive: boolean;
  isSystemTemplate: boolean;
  createdAt: number;
  updatedAt: number;

  // UI 计算属性
  displayName: string;
  statusText: string;
  channelText: string; // "应用内, 邮件, 推送"
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

// ============ 实体接口 ============

/**
 * NotificationTemplate 聚合根 - Client 接口（实例方法）
 */
export interface NotificationTemplateClient {
  // ===== 基础属性 =====
  uuid: string;
  name: string;
  description?: string | null;
  type: NotificationType;
  category: NotificationCategory;

  // ===== 模板内容（值对象） =====
  template: NotificationTemplateConfigClient;

  // ===== 状态 =====
  isActive: boolean;
  isSystemTemplate: boolean;

  // ===== 时间戳 =====
  createdAt: Date;
  updatedAt: Date;

  // ===== UI 计算属性 =====
  displayName: string;
  statusText: string;
  channelText: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;

  // ===== UI 业务方法 =====

  // 格式化展示

  // 预览

  // 操作判断

}
