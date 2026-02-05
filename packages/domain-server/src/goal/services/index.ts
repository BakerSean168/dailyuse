/**
 * Goal Services - Domain Server
 * 目标领域服务
 * 
 * 【保留的领域服务】
 * 只保留真正需要跨聚合根协调或需要查询数据库的领域服务：
 * - FocusSessionDomainService: 专注会话管理（部分方法需要重构）
 * - GoalProgressCalculator: 进度计算需要查询历史记录
 * - GoalHierarchy: 层级关系需要查询整棵树（循环依赖检测）
 * - GoalPriorityCalculatorService: 纯计算函数，可复用
 * 
 * 【已删除的服务】
 * - GoalDomainService: 贫血模型反模式，逻辑已移入 Goal 聚合根
 */

export * from './focus-session-domain.service';
export * from './goal-priority-calculator.service';
export * from './goal-progress-calculator';
export * from './goal-hierarchy';
