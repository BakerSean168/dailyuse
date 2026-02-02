/**
 * Example Module - domain-server 导出
 * 
 * 【规范说明】
 * domain-server 包包含：
 * - 聚合根（Aggregates）：业务逻辑的核心
 * - 实体（Entities）：有 ID 的领域对象
 * - 仓储接口（Repositories）：数据持久化抽象
 * - 领域服务（Domain Services）：跨聚合根的业务逻辑
 * 
 * 不包含：
 * - 值对象（在 domain-shared 中）
 * - 仓储实现（在 infrastructure-server 中）
 * - 应用服务（在 application-server 中）
 * 
 * 【时间类型规范 - ACL（Anti-Corruption Layer）】
 * - TransferDate = number：API 传输层（DTO）
 * - DomainDate = Date：业务逻辑层（Entity/Service 内部）
 * - PersistenceDate = Date：数据库存储层（Prisma）
 */

export * from './aggregates';
export * from './entities';
export * from './repositories';
export * from './services';
