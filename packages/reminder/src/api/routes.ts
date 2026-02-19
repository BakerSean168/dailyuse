/**
 * Reminder API Routes
 *
 * Route definitions and request handling for Reminder domain.
 * Middleware injected via parameters from ApiBootstrapper context.
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
import type { Request, Response, RequestHandler } from 'express';
import {
  CreateReminderTemplateSchema,
  UpdateReminderTemplateSchema,
  GetUpcomingRemindersSchema,
  CreateReminderGroupSchema,
  UpdateReminderGroupSchema,
  SwitchGroupControlModeSchema,
  BatchGroupTemplatesSchema,
} from '@dailyuse/contracts/reminder';
import { createExpressHelper } from '@dailyuse/utils/result';

// ============ Types ============

interface AuthenticatedRequest extends Request {
  id?: string;
  traceId?: string;
  startTime?: number;
  user?: {
    identityId: string;
    sessionId?: string;
    tokenType?: string;
    exp?: number;
  };
}

export interface ReminderRouteHandlers {
  // Template CRUD
  createTemplate(identityId: string, data: any): Promise<any>;
  listTemplates(identityId: string): Promise<any>;
  getUpcomingReminders(identityId: string, params: any): Promise<any>;
  getTemplate(id: string): Promise<any>;
  updateTemplate(id: string, data: any): Promise<any>;
  deleteTemplate(id: string): Promise<any>;
  // Group CRUD
  createGroup(identityId: string, data: any): Promise<any>;
  listGroups(identityId: string): Promise<any>;
  getGroup(id: string): Promise<any>;
  updateGroup(id: string, data: any): Promise<any>;
  deleteGroup(id: string): Promise<any>;
  switchGroupControlMode(id: string, data: any): Promise<any>;
  batchGroupTemplates(id: string, data: any): Promise<any>;
}

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
  handlers: ReminderRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // ────────── Template Routes ──────────

  // POST /templates — Create reminder template
  router.post('/templates', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const parsed = CreateReminderTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.createTemplate(req.user.identityId, parsed.data);
      return helper.created(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Create template failed';
      return helper.internalError(message);
    }
  });

  // GET /templates — List templates for current user
  router.get('/templates', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const result = await handlers.listTemplates(req.user.identityId);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'List templates failed';
      return helper.internalError(message);
    }
  });

  // GET /templates/upcoming — Get upcoming reminders
  router.get('/templates/upcoming', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const params = {
        limit: parseNumber(req.query.limit),
        beforeTime: parseString(req.query.beforeTime),
      };

      const parsed = GetUpcomingRemindersSchema.safeParse(params);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.getUpcomingReminders(req.user.identityId, parsed.data);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Get upcoming reminders failed';
      return helper.internalError(message);
    }
  });

  // GET /templates/:id — Get template by ID
  router.get('/templates/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const result = await handlers.getTemplate(req.params.id);
      if (!result) return helper.notFound('Template not found');
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Get template failed';
      return helper.internalError(message);
    }
  });

  // PUT /templates/:id — Update template
  router.put('/templates/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const parsed = UpdateReminderTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.updateTemplate(req.params.id, parsed.data);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update template failed';
      return helper.badRequest(message);
    }
  });

  // DELETE /templates/:id — Delete template
  router.delete('/templates/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      await handlers.deleteTemplate(req.params.id);
      return helper.success(null, 'Template deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete template failed';
      return helper.internalError(message);
    }
  });

  // ────────── Group Routes ──────────

  // POST /groups — Create reminder group
  router.post('/groups', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const parsed = CreateReminderGroupSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.createGroup(req.user.identityId, parsed.data);
      return helper.created(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Create group failed';
      return helper.internalError(message);
    }
  });

  // GET /groups — List groups for current user
  router.get('/groups', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const result = await handlers.listGroups(req.user.identityId);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'List groups failed';
      return helper.internalError(message);
    }
  });

  // GET /groups/:id — Get group by ID
  router.get('/groups/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const result = await handlers.getGroup(req.params.id);
      if (!result) return helper.notFound('Group not found');
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Get group failed';
      return helper.internalError(message);
    }
  });

  // PUT /groups/:id — Update group
  router.put('/groups/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const parsed = UpdateReminderGroupSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.updateGroup(req.params.id, parsed.data);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update group failed';
      return helper.badRequest(message);
    }
  });

  // DELETE /groups/:id — Delete group
  router.delete('/groups/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      await handlers.deleteGroup(req.params.id);
      return helper.success(null, 'Group deleted');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete group failed';
      return helper.internalError(message);
    }
  });

  // POST /groups/:id/control-mode — Switch group control mode
  router.post('/groups/:id/control-mode', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const parsed = SwitchGroupControlModeSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.switchGroupControlMode(req.params.id, parsed.data);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Switch control mode failed';
      return helper.badRequest(message);
    }
  });

  // POST /groups/:id/batch — Batch group template operations
  router.post('/groups/:id/batch', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const parsed = BatchGroupTemplatesSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return helper.validationError(`Validation failed: ${details.map(d => d.message).join(', ')}`);
      }

      const result = await handlers.batchGroupTemplates(req.params.id, parsed.data);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Batch operation failed';
      return helper.internalError(message);
    }
  });

  return router;
}
