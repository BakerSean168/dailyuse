/**
 * Example Entities
 * 示例模块实体导出
 * 
 * 【规范说明：实体（Entity）】
 * 实体是有唯一标识符的领域对象：
 * - 有唯一标识符（ID/UUID）：通过 ID 区分，而非属性值
 * - 有生命周期：可以被创建、修改、删除
 * - 从属于聚合根：只能通过聚合根访问和修改
 * - 可变性：状态可以改变，但 ID 不变
 * 
 * 【实体 vs 聚合根】
 * - 实体（Entity）：聚合内的子对象，不能独立存在
 * - 聚合根（Aggregate Root）：聚合的入口，对外代表整个聚合
 * 
 * 【实体 vs 值对象】
 * - 实体（Entity）：有 ID，可变，通过 ID 比较
 * - 值对象（Value Object）：无 ID，不可变，通过值比较
 * 
 * 【ExampleTag 实体示例】
 * 展示了标准的实体实现模式：
 * - 继承 Entity 基类（提供 UUID）
 * - 私有构造函数 + 工厂方法
 * - 时间字段使用 Date
 * - 转换方法：toServerDTO(), toPersistenceDTO()
 */

export { RuleRevision } from './rule-revision';
export type { RuleRevisionState } from './rule-revision';
