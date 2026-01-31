/**
 * DashboardConfig Aggregate Root - Client Interface
 * Dashboard 配置聚合根 - 客户端接口
 */
import type { WidgetConfigDTO } from '../value-objects/widget-config';
import type { WidgetConfigData } from './dashboard-config-server';

// ============ DTO 定义 ============

/**
 * DashboardConfig Client DTO
 */
export interface DashboardConfigClientDTO {
  uuid: string;
  accountUuid: string;
  widgetConfig: WidgetConfigData;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  
  // UI 扩展
  visibleWidgetIds: string[];
  widgetCount: number;
}

// ============ 实体接口 ============

/**
 * DashboardConfig 聚合根 - Client 接口
 */
export interface DashboardConfigClient {
  uuid: string;
  accountUuid: string;
  widgetConfig: WidgetConfigData;
  createdAt: Date;
  updatedAt: Date;
  
  // UI 扩展
  visibleWidgetIds: string[];
  widgetCount: number;
}
