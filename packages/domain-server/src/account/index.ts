/**
 * Account Module - Domain Server
 * 账户模块 - 领域服务端
 * 
 * 【模块职责】
 * 管理用户账户的核心业务逻辑，包括账户状态、配置、可用性等
 * 
 * 【包含内容】
 * - 聚合根（Aggregates）：Account - 账户聚合根
 * - 仓储接口（Repositories）：IAccountRepository - 账户持久化接口
 * - 领域服务（Domain Services）：AccountUniquenessChecker - 账户唯一性检查
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

// Aggregates
export { Account } from './aggregates/account';

// Entities



// Repositories
export {
  type IAccountRepository,
} from './repositories/i-account-repository';

// Services
export { AccountUniquenessChecker } from './services/account-uniqueness-checker';
