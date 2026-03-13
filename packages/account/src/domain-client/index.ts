/**
 * Account Module - Domain Client
 *
 * Client-side domain model exports.
 */

// ===== Aggregates =====
export { Account, type AccountState } from './aggregates/account';

// ===== Value Objects (re-export from domain-shared) =====
export * from '../domain-shared';
