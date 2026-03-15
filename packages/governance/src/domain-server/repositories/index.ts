/**
 * Governance Repositories
 * 治理模块仓储接口导出
 *
 * 【规范说明：Repository 模式】
 * Repository 是领域层和持久化层之间的抽象：
 * - 接口定义：在 domain-server 包中定义接口
 * - 具体实现：在 infrastructure-server 包中实现
 * - 依赖倒置：领域层不依赖具体的数据库技术
 *
 * 【Repository 职责】
 * - 持久化聚合根：save() 方法保存整个聚合
 * - 重建聚合根：findById() 从数据库恢复聚合
 * - 查询聚合根：提供各种查询方法
 * - 处理领域事件：保存时触发事件发布
 *
 * 【Repository 设计原则】
 * ✅ 应该做的：
 * - 以聚合根为单位操作（不是表）
 * - 返回领域对象（不是 ORM 对象）
 * - 使用值对象作为参数（不是原始类型）
 * - 方法命名体现业务意图（findActiveByUser，不是 select）
 *
 * ❌ 不应该做的：
 * - 暴露 ORM 特定的 API（不要返回 QueryBuilder）
 * - 直接操作实体（实体应该通过聚合根访问）
 * - 包含业务逻辑（业务逻辑属于聚合根或领域服务）
 *
 * 【注入 Token】
 * 使用 Symbol 作为 DI 容器的注入标识，避免字符串冲突
 */

export type { IRuleRepository } from './i-rule-repository';
export type { RuleFilter } from './i-rule-repository';
export { RULE_REPOSITORY_TOKEN } from './i-rule-repository';

export type { IRuleRevisionRepository } from './i-rule-revision-repository';
export { RULE_REVISION_REPOSITORY_TOKEN } from './i-rule-revision-repository';
