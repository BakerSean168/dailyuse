/**
 * Goal Services - Domain Server
 * 目标领域服务
 *
 * 【保留的领域服务】
 * 只保留真正需要跨聚合根协调或需要查询数据库的领域服务：
 * - GoalPolicy: 目标跨聚合规则校验
 * - GoalProgressCalculator: 进度计算需要查询历史记录
 *
 * 【已删除的服务】
 * - GoalDomainService: 贫血模型反模式，逻辑已移入 Goal 聚合根
 * - GoalHierarchy: 层级关系逻辑已移入 Goal 聚合根
 */

export * from './goal-policy.service';
export * from './goal-progress-calculator';

export * from './key-result-progress-calculator';
