/**
 * Sync Domain Services
 * 同步模块领域服务导出
 * 
 * 【规范说明：领域服务（Domain Service）】
 * 领域服务是跨聚合根的业务逻辑，使用场景：
 * - 一次操作涉及多个聚合根时
 * - 业务逻辑不属于任何单一聚合根
 * - 无决类状态：整个业务逻辑执行后才保存
 * - 注入仓储：很有给提供仓储侦可培议可蚓
 * 
 * 【SyncCoordinationService】
 * - 多设备同步协调：协调不同设备的同步状态
 * - 顺序控制：保证增量同步的安全性
 * 
 * 【ConflictResolutionService】
 * - 冲突检测和解决：检测数据冲突、应用解决方案
 * - 业务规则应用：根据不同情景应用不同解决策略
 */

// Export types and services
export type { SyncStrategy, ConflictResolutionStrategy } from './strategy-types';
