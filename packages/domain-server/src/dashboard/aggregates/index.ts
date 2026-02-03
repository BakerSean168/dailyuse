/**
 * Dashboard Aggregates
 * 仪表板模块聚合根导出
 * 
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念：
 * - 聚合的入口点：外部只能通过聚合根访问聚合内的实体
 * - 事务边界：一次事务只能修改一个聚合根
 * - 不变量守护者：确保聚合内的业务规则始终满足
 * - 领域事件发布者：状态变更时发出领域事件
 * 
 * 【DashboardConfig 聚合根】
 * - 仪表板配置管理：widget 位置、布局、样式
 * - 个性化设置：用户的仪表板布局偏好
 * - 预设配置：一些预设仪表板模板
 */

export { DashboardConfig } from './DashboardConfig';
