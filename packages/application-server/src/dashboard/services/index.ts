/**
 * Dashboard Services Index
 *
 * 导出所有 Dashboard 模块的 Services
 * 类型定义请从 @dailyuse/contracts/dashboard 导入
 */

// ===== Widget Config =====
export { GetWidgetConfig } from './get-widget-config';
export { UpdateWidgetConfig } from './update-widget-config';
export { ResetWidgetConfig } from './reset-widget-config';

// ===== Statistics =====
export { GetDashboardStatistics } from './get-dashboard-statistics';
export { InvalidateDashboardCache } from './invalidate-dashboard-cache';
