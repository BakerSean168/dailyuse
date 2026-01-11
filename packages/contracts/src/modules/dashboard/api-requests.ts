/**
 * Dashboard Module API Requests
 * 仪表盘模块 API 请求/响应类型定义
 */

import type { WidgetConfigData } from './aggregates';
import type { DashboardStatisticsClientDTO } from './DashboardStatisticsClient';

// ============ Dashboard Statistics 请求/响应 ============

/**
 * 获取仪表盘统计请求
 */
export interface GetDashboardStatisticsRequest {
  accountUuid: string;
}

/**
 * 仪表盘统计响应
 */
export interface DashboardStatisticsResponse {
  statistics: DashboardStatisticsClientDTO;
}

// ============ Widget Config 请求/响应 ============

/**
 * 获取 Widget 配置请求
 */
export interface GetWidgetConfigRequest {
  accountUuid: string;
}

/**
 * Widget 配置响应
 */
export interface WidgetConfigResponse {
  widgetConfig: WidgetConfigData;
}

/**
 * 更新 Widget 配置请求
 */
export interface UpdateWidgetConfigRequest {
  configs: Partial<WidgetConfigData>;
}

/**
 * 重置 Widget 配置请求
 */
export interface ResetWidgetConfigRequest {
  accountUuid: string;
}

// ============ Cache 操作 ============

/**
 * 缓存失效请求
 */
export interface InvalidateCacheRequest {
  accountUuid: string;
}
