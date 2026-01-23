/**
 * @dailyuse/infrastructure-server
 *
 * Server Infrastructure Layer - Ports & Adapters (Module-based)
 *
 * This package implements the Hexagonal Architecture (Ports & Adapters) pattern
 * for server-side applications, organized by business module:
 *
 * - Goal: Goal persistence
 * - Task: Task persistence
 * - Schedule: Schedule persistence
 * - Reminder: Reminder persistence
 * - Account: Account persistence
 * - Authentication: Auth credential and session persistence
 * - AI: AI conversation, generation task, provider config, usage quota persistence
 * - Notification: Notification, preference, template persistence
 * - Dashboard: Dashboard config persistence
 * - Repository: Repository, folder, resource, statistics persistence
 * - Setting: App config, setting, user setting persistence
 *
 * Each module provides:
 * - Ports: Repository interface definitions
 * - Adapters: Prisma (PostgreSQL) and SQLite (Desktop) implementations
 * - DI Container: Factory and container classes for dependency injection
 *
 * Initialization:
 * - For API: use initializePrismaDataSource()
 * - For Desktop: use initializeSQLiteDataSource(db)
 */

// Bootstrap and Configuration
export { initializePrismaDataSource, initializeSQLiteDataSource, initializeWithConfig, getDataSourceManager } from './bootstrap';

// Modules
export * from './goal';
export * from './task';
export * from './schedule';
export * from './reminder';
export * from './account';
export * from './authentication';
export * from './ai';
export * from './notification';
export * from './dashboard';
export * from './repository';
export * from './setting';
export * from './sync';

// Shared
export * from './shared';

