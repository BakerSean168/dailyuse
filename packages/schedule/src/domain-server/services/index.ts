/**
 * Schedule Domain Services
 * 调度模块服务统一导出
 * 
 * 【规范说明：领域服务（Domain Service）】
 * 领域服务是跨聚合根的业务逻辑，使用场景：
 * - 一次操作涉及多个聚合根时（例：Goal 上下文事件 Schedule）
 * - 业务逻辑不属于任何单一聚合根
 * - 无决类状态：整个业务逻辑执行后才保存
 * - 不注入仓储，仅包含纯业务逻辑
 * 
 * 【ScheduleExecutionEngine】
 * - 日程执行引擎：事件驱动执行
 * 
 * 【ScheduleStrategyFactory】
 * - 策略工厂：根据不同类型选择策略
 */

export * from './ScheduleExecutionEngine';
export * from './strategies/IScheduleStrategy';
export * from './strategies/GoalScheduleStrategy';
export * from './strategies/TaskScheduleStrategy';
export * from './strategies/ReminderScheduleStrategy';
export * from './strategies/ScheduleStrategyFactory';
