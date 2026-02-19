/**
 * Schedule API Routes
 *
 * Route definitions and request handling for schedule tasks.
 * Middleware is injected via parameters (from ApiBootstrapper context),
 * no direct dependency on apps/api internals.
 *
 * Uses expressAdapter to eliminate boilerplate code:
 * - Zod validation is handled by the ScheduleController
 * - Error handling is unified via the adapter
 * - Context extraction is automatic
 *
 * Routes:
 *   POST   /tasks            — Create schedule task
 *   GET    /tasks            — List tasks with query params
 *   GET    /tasks/:id        — Get task by ID
 *   PUT    /tasks/:id        — Update task
 *   DELETE /tasks/:id        — Delete task
 *   POST   /tasks/:id/pause  — Pause task
 *   POST   /tasks/:id/resume — Resume task
 *   POST   /tasks/:id/trigger — Trigger task
 *   POST   /tasks/batch      — Batch operations
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import { ScheduleController } from './controller';

// ============ Types ============

export interface ScheduleRouteHandlers {
  createTask(data: any): Promise<any>;
  updateTask(data: any): Promise<any>;
  deleteTask(id: string): Promise<void>;
  pauseTask(id: string): Promise<any>;
  resumeTask(id: string): Promise<any>;
  triggerTask(id: string): Promise<void>;
  getTask(id: string): Promise<any>;
  listTasksByAccount(identityId: string): Promise<any>;
  listTasksBySource(sourceModule: string, sourceEntityId: string): Promise<any>;
  listTasksByStatus(status: string): Promise<any>;
}

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

// ============ Helpers ============

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

function parseString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return String(value);
}

function parseBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return undefined;
}

// ============ Route Registration ============

export function registerScheduleRoutes(
  handlers: ScheduleRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new ScheduleController(handlers);

  // POST /tasks/batch — Batch operations (must be before /tasks/:id)
  router.post('/tasks/batch', auth, expressAdapter(
    (req) => controller.batchOperation(req.body),
  ));

  // POST /tasks — Create schedule task
  router.post('/tasks', auth, expressAdapter(
    (req, ctx) => controller.createTask(req.body, ctx.identityId),
    { successStatus: 201 },
  ));

  // GET /tasks — List tasks with query params
  router.get('/tasks', auth, expressAdapter(
    (req, ctx) => controller.listTasks(ctx.identityId, {
      sourceModule: parseString(req.query?.sourceModule),
      sourceEntityId: parseString(req.query?.sourceEntityId),
      status: parseString(req.query?.status),
      enabled: parseBoolean(req.query?.enabled),
      search: parseString(req.query?.search),
      page: parseNumber(req.query?.page),
      limit: parseNumber(req.query?.limit),
      sortBy: parseString(req.query?.sortBy),
      sortOrder: parseString(req.query?.sortOrder),
    }),
  ));

  // GET /tasks/:id — Get task by ID
  router.get('/tasks/:id', auth, expressAdapter(
    (req) => controller.getTask(req.params!.id),
  ));

  // PUT /tasks/:id — Update task
  router.put('/tasks/:id', auth, expressAdapter(
    (req) => controller.updateTask(req.params!.id, req.body),
  ));

  // DELETE /tasks/:id — Delete task
  router.delete('/tasks/:id', auth, expressAdapter(
    (req) => controller.deleteTask(req.params!.id),
  ));

  // POST /tasks/:id/pause — Pause task
  router.post('/tasks/:id/pause', auth, expressAdapter(
    (req) => controller.pauseTask(req.params!.id),
  ));

  // POST /tasks/:id/resume — Resume task
  router.post('/tasks/:id/resume', auth, expressAdapter(
    (req) => controller.resumeTask(req.params!.id),
  ));

  // POST /tasks/:id/trigger — Trigger task
  router.post('/tasks/:id/trigger', auth, expressAdapter(
    (req) => controller.triggerTask(req.params!.id),
  ));

  return router;
}
