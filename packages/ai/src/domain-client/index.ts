/**
 * AI Module - Domain Client
 *
 * Manages client-side domain models for AI features, including
 * conversation management and message handling.
 *
 * Contents:
 * - Aggregates: AIConversation
 * - Entities: Message
 * - Value Objects: imported from server/domain
 *
 * Dependency rules:
 * Allowed:
 * - @memoflow/utils (base classes: AggregateRoot, Entity)
 * - @memoflow/contracts (DTO interfaces, Client interfaces)
 * - server/domain (value objects, enums)
 *
 * Forbidden:
 * - server/domain aggregates and repositories
 * - @memoflow/infrastructure-* (infrastructure layer)
 * - @memoflow/application-* (application layer)
 */

// ===== Aggregates =====
export * from './aggregates';

// ===== Entities =====
export * from './entities';

// ===== Value Objects (re-export from server domain) =====
export * from '../server/domain/value-objects';
