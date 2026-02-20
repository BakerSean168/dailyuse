/**
 * OpenAPI Module Registrations
 *
 * Import all per-module OpenAPI registrations so they execute
 * their side-effects (registering schemas and paths on the shared registry).
 *
 * This file must be imported before calling generateOpenApiDocument().
 */

import './goal.openapi';
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
