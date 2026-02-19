/**
 * Schedule API Routes
 *
 * Route definitions and request handling for schedule tasks.
 * Middleware is injected via parameters (from ApiBootstrapper context),
 * no direct dependency on apps/api internals.
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
import type { Request, Response, RequestHandler } from 'express';
import {
  CreateScheduleTaskRequestSchema,
  UpdateScheduleTaskRequestSchema,
  ScheduleTaskQueryParamsSchema,
  BatchScheduleTaskOperationRequestSchema,
} from '@dailyuse/contracts/schedule';
import { createLogger } from '@dailyuse/utils';
import { createExpressHelper } from '@dailyuse/utils/result';

const logger = createLogger('ScheduleRoutes');

// ============ Types ============

interface AuthUser {
  identityId: string;
  sessionId?: string;
}

interface AuthenticatedRequest extends Request {
  id?: string;
  traceId?: string;
  startTime?: number;
  user?: AuthUser;
}

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

  // POST /tasks/batch — Batch operations (must be before /tasks/:id)
  router.post('/tasks/batch', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const parsed = BatchScheduleTaskOperationRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }
      const { taskIds, operation } = parsed.data;
      const results = { success: [] as string[], failed: [] as { taskId: string; error: string }[] };
      for (const taskId of taskIds) {
        try {
          switch (operation) {
            case 'pause':
              await handlers.pauseTask(taskId);
              break;
            case 'resume':
              await handlers.resumeTask(taskId);
              break;
            default:
              throw new Error(`Unsupported batch operation: ${operation}`);
          }
          results.success.push(taskId);
        } catch (err) {
          results.failed.push({
            taskId,
            error: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }
      return helper.success({
        ...results,
        total: taskIds.length,
        successCount: results.success.length,
        failedCount: results.failed.length,
      }, 'Batch operation completed');
    } catch (error) {
      logger.error('Batch operation failed:', error);
      const message = error instanceof Error ? error.message : 'Batch operation failed';
      return helper.internalError(message);
    }
  });

  // POST /tasks — Create schedule task
  router.post('/tasks', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const parsed = CreateScheduleTaskRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }
      const result = await handlers.createTask({
        name: parsed.data.name,
        sourceModule: parsed.data.sourceModule,
        sourceId: parsed.data.sourceEntityId,
        scheduleConfig: parsed.data.schedule,
        handlerType: parsed.data.sourceModule,
        description: parsed.data.description,
        retryPolicy: parsed.data.retryPolicy,
        enabled: parsed.data.enabled,
        identityId: req.user.identityId,
      });
      return helper.created(result, 'Schedule task created');
    } catch (error) {
      logger.error('Create schedule task failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to create schedule task';
      return helper.badRequest(message);
    }
  });

  // GET /tasks — List tasks with query params
  router.get('/tasks', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const queryParams = {
        sourceModule: parseString(req.query.sourceModule),
        sourceEntityId: parseString(req.query.sourceEntityId),
        status: parseString(req.query.status),
        enabled: parseBoolean(req.query.enabled),
        search: parseString(req.query.search),
        page: parseNumber(req.query.page),
        limit: parseNumber(req.query.limit),
        sortBy: parseString(req.query.sortBy),
        sortOrder: parseString(req.query.sortOrder),
      };
      const parsed = ScheduleTaskQueryParamsSchema.safeParse(queryParams);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      // Route to specific list use case based on query params
      let result: any;
      if (parsed.data.status) {
        result = await handlers.listTasksByStatus(parsed.data.status);
      } else if (parsed.data.sourceModule && parsed.data.sourceEntityId) {
        result = await handlers.listTasksBySource(parsed.data.sourceModule, parsed.data.sourceEntityId);
      } else {
        result = await handlers.listTasksByAccount(req.user.identityId);
      }
      return helper.success(result, 'Schedule tasks retrieved');
    } catch (error) {
      logger.error('List schedule tasks failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to list schedule tasks';
      return helper.internalError(message);
    }
  });

  // GET /tasks/:id — Get task by ID
  router.get('/tasks/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const result = await handlers.getTask(req.params.id);
      if (!result) {
        return helper.notFound('Schedule task not found');
      }
      return helper.success(result, 'Schedule task retrieved');
    } catch (error) {
      logger.error('Get schedule task failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to get schedule task';
      return helper.internalError(message);
    }
  });

  // PUT /tasks/:id — Update task
  router.put('/tasks/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const parsed = UpdateScheduleTaskRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }
      const result = await handlers.updateTask({
        id: req.params.id,
        scheduleConfig: parsed.data.schedule,
        retryPolicy: parsed.data.retryPolicy,
        enabled: parsed.data.enabled,
        description: parsed.data.description,
      });
      return helper.success(result, 'Schedule task updated');
    } catch (error) {
      logger.error('Update schedule task failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to update schedule task';
      return helper.badRequest(message);
    }
  });

  // DELETE /tasks/:id — Delete task
  router.delete('/tasks/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      await handlers.deleteTask(req.params.id);
      return helper.success(null, 'Schedule task deleted');
    } catch (error) {
      logger.error('Delete schedule task failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete schedule task';
      return helper.badRequest(message);
    }
  });

  // POST /tasks/:id/pause — Pause task
  router.post('/tasks/:id/pause', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const result = await handlers.pauseTask(req.params.id);
      return helper.success(result, 'Schedule task paused');
    } catch (error) {
      logger.error('Pause schedule task failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to pause schedule task';
      return helper.badRequest(message);
    }
  });

  // POST /tasks/:id/resume — Resume task
  router.post('/tasks/:id/resume', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      const result = await handlers.resumeTask(req.params.id);
      return helper.success(result, 'Schedule task resumed');
    } catch (error) {
      logger.error('Resume schedule task failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to resume schedule task';
      return helper.badRequest(message);
    }
  });

  // POST /tasks/:id/trigger — Trigger task
  router.post('/tasks/:id/trigger', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) {
        return helper.unauthorized();
      }
      await handlers.triggerTask(req.params.id);
      return helper.success(null, 'Schedule task triggered');
    } catch (error) {
      logger.error('Trigger schedule task failed:', error);
      const message = error instanceof Error ? error.message : 'Failed to trigger schedule task';
      return helper.badRequest(message);
    }
  });

  return router;
}
