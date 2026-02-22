/**
 * Account Module - Domain Client
 * 客户端领域模�?
 */

// ===== Aggregates =====
export { Account, type AccountState } from './aggregates/account';

// ===== Value Objects (re-export from domain-shared) =====
export * from '../domain-shared';
