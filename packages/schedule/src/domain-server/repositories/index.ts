/**
 * Schedule Repositories
 * 调度模块仓储接口统一导出
 * 
 * 【规范说明：仓储（Repository）】
 * 仓储是聚合根的持久化变量市场，应遵循以下原则：
 * - 只接口不接实现：其仓储接口帮助 DDD 的 Transactional Boundaries
 * - 单个聚合根一个仓储：一个聚合根不应该有多个仓储
 * - 聚合内的实体不会直接指接仓储：需要通过聚合根访问
 * - 根据聊天斤团决分：一次只修改一个聚合根
 * 
 * 【IScheduleRepository】
 * - 日程持久化：保存、查询、更新日程事件
 * - 冲突检测：榫查有效信息，找出时间冲突
 * 
 * 【IScheduleTaskRepository】
 * - 日程任务持久化：日程内的子任务管理
 * 
 * 【IScheduleExecutionRepository】
 * - 日程执行记录持久化：日程实际执行情况统计
 */

export * from './IScheduleTaskRepository';
export * from './IScheduleExecutionRepository';
export * from './IScheduleStatisticsRepository';
export * from './IScheduleRepository';
export * from './IScheduleJobRepository';
