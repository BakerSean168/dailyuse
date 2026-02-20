/**
 * OpenAPI Module Registrations
 *
 * Import all per-module OpenAPI registrations so they execute
 * their side-effects (registering schemas and paths on the shared registry).
 *
 * This file must be imported before calling generateOpenApiDocument().
 *
 * NOTE: Goal module uses unified RouteRegistrar — its OpenAPI paths
 * are registered in packages/goal/src/api/routes.ts alongside Express routes.
 */

// import './goal.openapi'; // ← migrated to unified RouteRegistrar in @dailyuse/goal
import './task.openapi';
import './reminder.openapi';
import './schedule.openapi';
import './notification.openapi';
import './authentication.openapi';
import './editor.openapi';
import './setting.openapi';
import './governance.openapi';
import './account.openapi';
import './repository.openapi';
