/**
 * Reminder API Routes
 *
 * Route definitions and request handling for Reminder domain.
 * Middleware injected via parameters from ApiBootstrapper context.
 *
 * Uses expressAdapter to eliminate boilerplate code:
 * - Zod validation is handled by the ReminderController
 * - Error handling is unified via the adapter
 * - Context extraction is automatic
 *
 * Routes:
 *   POST   /templates              — Create reminder template
 *   GET    /templates              — List templates for current user
 *   GET    /templates/upcoming     — Get upcoming reminders
 *   GET    /templates/:id          — Get template by ID
 *   PUT    /templates/:id          — Update template
 *   DELETE /templates/:id          — Delete template
 *   POST   /groups                 — Create reminder group
 *   GET    /groups                 — List groups for current user
 *   GET    /groups/:id             — Get group by ID
 *   PUT    /groups/:id             — Update group
 *   DELETE /groups/:id             — Delete group
 *   POST   /groups/:id/control-mode — Switch group control mode
 *   POST   /groups/:id/batch       — Batch group template operations
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import { ReminderController } from '../controllers/reminder.controller';
import type { ReminderUseCases } from '../controllers/reminder.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Helpers ============

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

function parseString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

// ============ Route Registration ============

export function registerReminderRoutes(
  handlers: ReminderUseCases,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new ReminderController(handlers);

  // ────────── Template Routes ──────────

  // POST /templates — Create reminder template
  router.post('/templates', auth, expressAdapter(
    (req, ctx) => controller.createTemplate(req.body, ctx),
    { successStatus: 201 },
  ));

  // GET /templates — List templates for current user
  router.get('/templates', auth, expressAdapter(
    (_req, ctx) => controller.listTemplates(ctx),
  ));

  // GET /templates/upcoming — Get upcoming reminders
  router.get('/templates/upcoming', auth, expressAdapter(
    (req, ctx) => controller.getUpcomingReminders({
      limit: parseNumber(req.query?.limit),
      beforeTime: parseString(req.query?.beforeTime),
    }, ctx),
  ));

  // GET /templates/:id — Get template by ID
  router.get('/templates/:id', auth, expressAdapter(
    (req) => controller.getTemplate(req.params!.id),
  ));

  // PUT /templates/:id — Update template
  router.put('/templates/:id', auth, expressAdapter(
    (req) => controller.updateTemplate(req.params!.id, req.body),
  ));

  // DELETE /templates/:id — Delete template
  router.delete('/templates/:id', auth, expressAdapter(
    (req) => controller.deleteTemplate(req.params!.id),
  ));

  // ────────── Group Routes ──────────

  // POST /groups — Create reminder group
  router.post('/groups', auth, expressAdapter(
    (req, ctx) => controller.createGroup(req.body, ctx),
    { successStatus: 201 },
  ));

  // GET /groups — List groups for current user
  router.get('/groups', auth, expressAdapter(
    (_req, ctx) => controller.listGroups(ctx),
  ));

  // GET /groups/:id — Get group by ID
  router.get('/groups/:id', auth, expressAdapter(
    (req) => controller.getGroup(req.params!.id),
  ));

  // PUT /groups/:id — Update group
  router.put('/groups/:id', auth, expressAdapter(
    (req) => controller.updateGroup(req.params!.id, req.body),
  ));

  // DELETE /groups/:id — Delete group
  router.delete('/groups/:id', auth, expressAdapter(
    (req) => controller.deleteGroup(req.params!.id),
  ));

  // POST /groups/:id/control-mode — Switch group control mode
  router.post('/groups/:id/control-mode', auth, expressAdapter(
    (req) => controller.switchGroupControlMode(req.params!.id, req.body),
  ));

  // POST /groups/:id/batch — Batch group template operations
  router.post('/groups/:id/batch', auth, expressAdapter(
    (req) => controller.batchGroupTemplates(req.params!.id, req.body),
  ));

  return router;
}
