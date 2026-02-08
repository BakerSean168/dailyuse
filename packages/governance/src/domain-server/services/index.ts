/**
 * Example Domain Services
 * 示例模块领域服务导出
 * 
 * 【规范说明：Domain Service】
 * 领域服务处理不适合放在聚合根中的业务逻辑：
 * 
 * 【何时使用领域服务】
 * ✅ 跨聚合根操作：
 *    - 操作涉及多个聚合根实例
 *    - 需要协调多个聚合根的状态变更
 * ✅ 需要外部依赖：
 *    - 需要调用 Repository
 *    - 需要调用外部服务（如发送邮件）
 * ✅ 无自然归属：
 *    - 操作逻辑不自然地属于任何一个聚合根
 *    - 强行放入聚合根会破坏单一职责原则
 * 
 * 【何时不使用领域服务】
 * ❌ 单聚合根操作：
 *    - 只涉及一个聚合根的状态变更
 *    - 应该放在聚合根的业务方法中
 * ❌ 简单 CRUD：
 *    - 直接调用 Repository 的增删改查
 *    - 应该放在 Application Service 中
 * ❌ 应用层逻辑：
 *    - UI 展示逻辑、请求校验、权限检查
 *    - 应该放在 Application Service 中
 * 
 * 【领域服务 vs 应用服务】
 * - Domain Service：包含核心业务规则，可复用于多个应用场景
 * - Application Service：编排用例流程，处理应用层关注点
 * 
 * 【ExampleDomainService 示例】
 * 展示了典型的领域服务使用场景：
 * - batchActivate: 批量操作多个聚合根
 * - canCreateMore: 跨聚合根的业务规则检查
 * - transferOwnership: 复杂的跨实体操作
 */

export { FeatureOne } from './feature-one';
