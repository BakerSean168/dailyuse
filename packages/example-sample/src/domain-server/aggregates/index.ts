/**
 * Example Aggregates
 * 示例模块聚合根导出
 * 
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念：
 * - 聚合的入口点：外部只能通过聚合根访问聚合内的实体
 * - 事务边界：一次事务只能修改一个聚合根
 * - 不变量守护者：确保聚合内的业务规则始终满足
 * - 领域事件发布者：状态变更时发出领域事件
 * 
 * 【Example 聚合根示例】
 * 展示了完整的聚合根实现模式：
 * - 私有构造函数 + 工厂方法
 * - 内部状态封装（private backing fields）
 * - 只读 getter 暴露状态
 * - 业务方法修改状态 + 发布事件
 * - 时间类型转换（DomainDate ↔ TransferDate ↔ PersistenceDate）
 */

export { Example } from './example';
