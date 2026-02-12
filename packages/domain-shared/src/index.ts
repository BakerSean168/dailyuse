/**
 * Domain-Shared Package
 * 
 * This package contains truly shared domain primitives and utilities
 * that are used across multiple domain modules.
 * 
 * Each domain module (account, goal, task, etc.) should export their own
 * domain-shared code directly from their package (e.g., @dailyuse/account/domain-shared).
 * 
 * This package should NOT re-export domain-shared from other modules to avoid
 * circular dependencies.
 */

export * from './shared';