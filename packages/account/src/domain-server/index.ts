/**
 * Account Module - Domain Server
 * 聚合根、仓储接口、领域服�?
 */

// Aggregates
export { Account } from './aggregates/account';
export type { AccountState } from './aggregates/account';

// Repositories
export { type IAccountRepository } from './repositories/i-account-repository';

// Services
export { AccountUniquenessChecker } from './services/account-uniqueness-checker';
