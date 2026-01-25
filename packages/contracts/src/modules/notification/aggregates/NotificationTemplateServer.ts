/**
 * NotificationTemplate Aggregate Root - Server Interface
 * 通知模板聚合根 - 服务端接口
 */

import type { NotificationType, NotificationCategory } from '../enums';
import type {
  NotificationTemplateConfigServer,
  NotificationTemplateConfigServerDTO,
} from '../value-objects';

// ============ DTO 定义 ============

/**
 * NotificationTemplate Server DTO (聚合根级别)
 */
export interface NotificationTemplateAggregateServerDTO {
  uuid: string;
  name: string;
  description?: string | null;
  type: NotificationType;
  category: NotificationCategory;
  template: NotificationTemplateConfigServerDTO;
  isActive: boolean;
  isSystemTemplate: boolean; // 系统预设模板
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/**
 * NotificationTemplate Persistence DTO (数据库映射)
 */
export interface NotificationTemplateAggregatePersistenceDTO {
  uuid: string;
  name: string;
  description?: string | null;
  type: NotificationType;
  category: NotificationCategory;
  isActive: boolean;
  isSystemTemplate: boolean;

  // Flattened template config
  templateTitle: string;
  templateContent: string;
  templateVariables?: string; // JSON array of strings
  templateLayout?: string; // e.g., 'default', 'compact'
  templateStyle?: string; // JSON for CSS styles

  // Email specific
  templateEmailSubject?: string;
  templateEmailHtmlBody?: string;
  templateEmailTextBody?: string;

  // Push specific
  templatePushTitle?: string;
  templatePushBody?: string;
  templatePushIcon?: string;
  templatePushSound?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ============ 领域事件 ============

/**
 * 模板创建事件
 */
export interface NotificationTemplateCreatedEvent {
  type: 'notification.template.created';
  aggregateId: string; // templateUuid
  timestamp: Date; // epoch ms
  payload: {
    template: NotificationTemplateAggregateServerDTO;
  };
}

/**
 * 模板更新事件
 */
export interface NotificationTemplateUpdatedEvent {
  type: 'notification.template.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    template: NotificationTemplateAggregateServerDTO;
    changes: string[];
  };
}

/**
 * 模板激活/停用事件
 */
export interface NotificationTemplateActivationChangedEvent {
  type: 'notification.template.activation.changed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    templateUuid: string;
    isActive: boolean;
  };
}

/**
 * NotificationTemplate 领域事件联合类型
 */
export type NotificationTemplateDomainEvent =
  | NotificationTemplateCreatedEvent
  | NotificationTemplateUpdatedEvent
  | NotificationTemplateActivationChangedEvent;

// ============ 实体接口 ============

/**
 * NotificationTemplate 聚合根 - Server 接口（实例方法）
 */
export interface NotificationTemplateServer {
  // ===== 基础属性 =====
  uuid: string;
  name: string;
  description?: string | null;
  type: NotificationType;
  category: NotificationCategory;

  // ===== 模板内容（值对象） =====
  template: NotificationTemplateConfigServer;

  // ===== 状态 =====
  isActive: boolean;
  isSystemTemplate: boolean;

  // ===== 时间戳 (统一使用 number epoch ms) =====
  createdAt: Date;
  updatedAt: Date;

  // ===== 业务方法 =====

  // 模板管理
  activate(): void;
  deactivate(): void;
  updateTemplate(template: Partial<NotificationTemplateConfigServerDTO>): void;

  // 渲染
  render(variables: Record<string, any>): { title: string; content: string };
  renderEmail(variables: Record<string, any>): {
    subject: string;
    htmlBody: string;
    textBody?: string;
  };
  renderPush(variables: Record<string, any>): { title: string; body: string };

  // 验证
  validateVariables(variables: Record<string, any>): {
    isValid: boolean;
    missingVariables: string[];
  };

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): NotificationTemplateAggregateServerDTO;

  /**
   * 转换为 Persistence DTO (数据库)
   */
  toPersistenceDTO(): NotificationTemplateAggregatePersistenceDTO;
}

/**
 * NotificationTemplate 静态工厂方法接口
 */
export interface NotificationTemplateServerStatic {
  /**
   * 创建新的 NotificationTemplate 聚合根（静态工厂方法）
   */
  create(params: {
    name: string;
    type: NotificationType;
    category: NotificationCategory;
    template: NotificationTemplateConfigServerDTO;
    description?: string;
    isSystemTemplate?: boolean;
  }): NotificationTemplateServer;

  /**
   * 从 Server DTO 创建实体
   */
  fromServerDTO(dto: NotificationTemplateAggregateServerDTO): NotificationTemplateServer;

  /**
   * 从 Persistence DTO 创建实体
   */
  fromPersistenceDTO(dto: NotificationTemplateAggregatePersistenceDTO): NotificationTemplateServer;
}
