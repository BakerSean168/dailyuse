/**
 * Governance Module - Domain Server
 * 治理模块 - 领域服务端
 *
 * 【模块职责】
 * 作为活文档，展示 domain-server 包的标准结构和最佳实践
 *
 * 【包含内容】
 * - 聚合根（Aggregates）：业务逻辑的核心，富领域模型
 * - 实体（Entities）：有唯一标识的领域对象，从属于聚合根
 * - 仓储接口（Repositories）：数据持久化的抽象层，定义而不实现
 * - 领域服务（Domain Services）：跨聚合根的复杂业务逻辑编排
 *
 * 【不包含内容】
 * - 值对象（Value Objects）：定义在 @dailyuse/domain-shared 中
 * - 仓储实现（Repository Implementations）：实现在 @dailyuse/infrastructure-server 中
 * - 应用服务（Application Services）：实现在 @dailyuse/application-server 中
 * - DTO 定义（Data Transfer Objects）：定义在 @dailyuse/contracts 中
 *
 * 【时间类型规范 - ACL（Anti-Corruption Layer）】
 * 防止不同层级的时间类型相互污染：
 * - TransferDate = number：API 传输层（DTO），Unix 时间戳，用于跨进程通信
 * - DomainDate = Date：业务逻辑层（Entity/Service 内部），用于日期计算和比较
 * - PersistenceDate = Date：数据库存储层（Prisma），ORM 返回的原生类型
 *
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils（基类：AggregateRoot, Entity）
 * - @dailyuse/contracts（DTO 接口、事件 Map）
 * - @dailyuse/domain-shared（值对象、枚举）
 *
 * ❌ 禁止依赖：
 * - @dailyuse/domain-client（客户端领域模型）
 * - @dailyuse/infrastructure-*（基础设施层）
 * - @dailyuse/application-*（应用层）
 * - 外部 I/O 库（fs, axios, prisma, ioredis 等）
 */

export * from './aggregates';
export * from './entities';
export * from './repositories';
export * from './services';
