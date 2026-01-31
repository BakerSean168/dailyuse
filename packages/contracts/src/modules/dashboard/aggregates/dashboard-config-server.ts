/**
 * DashboardConfig Aggregate Root - Server Interface
 * Dashboard 配置聚合根 - 服务端接口
 */
import type { WidgetConfigDTO } from '../value-objects/widget-config';

// ============ DTO 定义 ============

/**
 * Widget 配置数据类型
 * Key: Widget ID (如 'task-stats', 'goal-stats')
 * Value: Widget 配置
 */
export type WidgetConfigData = Record<string, WidgetConfigDTO>;

/**
 * DashboardConfig Server DTO
 */
export interface DashboardConfigServerDTO {
  uuid: string;
  accountUuid: string;
  widgetConfig: WidgetConfigData;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/**
 * DashboardConfig Persistence DTO (数据库映射)
 */
export interface DashboardConfigPersistenceDTO {
  id: number;
  accountUuid: string;
  widgetConfig: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

// ============ 实体接口 ============

/**
 * DashboardConfig 聚合根 - Server 接口
 */
export interface DashboardConfigServer {
  uuid: string;
  accountUuid: string;
  widgetConfig: WidgetConfigData;
  createdAt: Date;
  updatedAt: Date;
}
