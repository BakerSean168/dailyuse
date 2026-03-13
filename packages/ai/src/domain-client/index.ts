/**
 * AI Module - Domain Client
 *
 * Manages client-side domain models for AI features, including
 * conversation management and message handling.
 *
 * Contents:
 * - Aggregates: AIConversation
 * - Entities: Message
 * - Value Objects: imported from domain-shared
 *
 * Dependency rules:
 * Allowed:
 * - @dailyuse/utils (base classes: AggregateRoot, Entity)
 * - @dailyuse/contracts (DTO interfaces, Client interfaces)
 * - @dailyuse/domain-shared (value objects, enums)
 *
 * Forbidden:
 * - @dailyuse/domain-server (server-side domain models)
 * - @dailyuse/infrastructure-* (infrastructure layer)
 * - @dailyuse/application-* (application layer)
 */

// ===== Aggregates =====
export * from './aggregates';

// ===== Entities =====
export * from './entities';

// ===== Value Objects (re-export from domain-shared) =====
export * from '../domain-shared/value-objects';
