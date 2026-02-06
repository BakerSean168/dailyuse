/**
 * Authentication Module - Domain Client
 * 认证模块 - 领域客户端
 *
 * 【模块职责】
 * 管理用户认证的客户端领域模型
 *
 * 【包含内容】
 * - 聚合根（Aggregates）：AuthIdentity, AuthSession
 * - 实体（Entities）：AuthCredential
 * - 值对象（Value Objects）：从 domain-shared 导入
 *
 * 【依赖规则】
 * ✅ 允许依赖：
 * - @dailyuse/utils（基类：AggregateRoot, Entity）
 * - @dailyuse/contracts（DTO 接口、Client 接口）
 * - @dailyuse/domain-shared（值对象、枚举）
 */

// Export aggregates
export * from './aggregates';

// Export entities
export * from './entities';

// Re-export from domain-shared
export * from '@dailyuse/domain-shared/authentication';
