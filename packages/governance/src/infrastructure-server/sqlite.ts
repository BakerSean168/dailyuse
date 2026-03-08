/**
 * Governance Module - SQLite Exports
 */

export { RuleSqliteRepository, RuleRevisionSqliteRepository } from './adapters/sqlite';
export { GOVERNANCE_MODULE_SCHEMA } from './adapters/sqlite';
export { GovernanceModule, type GovernanceModuleRepositories } from './governance.module';
export { GovernanceContainer } from './di/governance-container';
