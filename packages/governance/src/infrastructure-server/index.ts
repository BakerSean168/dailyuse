/**
 * Infrastructure Server Layer - Barrel Export
 * 基础设施服务端层 - 统一导出
 * 
 * Server-side infrastructure:
 * - Repository implementations (Prisma)
 * - Persistence mappers
 * - Database connections
 */

// ============ Adapters - Prisma ============
export { RulePrismaRepository } from './adapters/prisma/rule-prisma.repository';
export { RuleRevisionPrismaRepository } from './adapters/prisma/rule-revision-prisma.repository';

// ============ Adapters - SQLite ============
export { RuleSqliteRepository, RuleRevisionSqliteRepository } from './adapters/sqlite';
export { GOVERNANCE_MODULE_SCHEMA } from './adapters/sqlite';

// ============ Composition Root ============
export { GovernanceModule, type GovernanceModuleRepositories } from './governance.module';
export { GovernanceContainer } from './di/governance-container';
