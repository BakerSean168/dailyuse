/**
 * NotificationTemplate Aggregate Root - Client Interface
 * 通知模板聚合根 - 客户端接口
 */

import type { NotificationType, NotificationCategory } from '../enums';
import type { NotificationTemplateAggregateServerDTO } from './NotificationTemplateServer';
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
  getDisplayName(): string;
  getStatusBadge(): { text: string; color: string };
  getTypeBadge(): { text: string; color: string };
  getChannelList(): string[];

  // 预览
  preview(variables: Record<string, any>): { title: string; content: string };

  // 操作判断
  canEdit(): boolean;
  canDelete(): boolean;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): NotificationTemplateAggregateServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): NotificationTemplateAggregateClientDTO;

  /**
   * 克隆当前实体（用于编辑表单）
   */
  clone(): NotificationTemplateClient;
}

/**
 * NotificationTemplate 静态工厂方法接口
 */
export interface NotificationTemplateClientStatic {
  /**
   * 创建新的 NotificationTemplate 聚合根（静态工厂方法）
   */
  create(params: {
    name: string;
    type: NotificationType;
    category: NotificationCategory;
    template: NotificationTemplateConfigClientDTO;
    description?: string;
    isSystemTemplate?: boolean;
  }): NotificationTemplateClient;

  /**
   * 创建用于创建表单的空 NotificationTemplate 实例
   */
  forCreate(): NotificationTemplateClient;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: NotificationTemplateAggregateServerDTO): NotificationTemplateClient;

  /**
   * 从 Client DTO 创建实体
   */
  fromClientDTO(dto: NotificationTemplateAggregateClientDTO): NotificationTemplateClient;
}
