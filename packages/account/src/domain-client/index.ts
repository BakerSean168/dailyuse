/**
 * Account Module - Domain Client
 *
 * Client-side domain model exports.
 */

// ===== Aggregates =====
export { Account, type AccountState } from './aggregates/account';

// ===== Value Objects (re-export from server domain) =====
export * from '../server/domain/value-objects';
