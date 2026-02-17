/**
 * Task Template Routes
 * 
 * Route registration for task template operations.
 * Follows ADR-021/022 split-route pattern.
 */

import { Router, type Request, type Response, type RequestHandler } from 'express';
import type { TaskTemplateController } from '../controllers/task-template.controller';
import {
  CreateTaskTemplateSchema,
  UpdateTaskTemplateSchema,
  type CreateTaskTemplateReq,
  type UpdateTaskTemplateReq,
} from '@dailyuse/contracts/task';
import {
  createResponseBuilder,
  errorCodeToHttpStatus,
  isOk,
  type Result,
  type ResultErrorDetail,
} from '@dailyuse/contracts/result';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

interface AuthenticatedRequest extends Request {
  user?: {
    identityId: string;
    sessionId?: string;
  };
}

// ============ Helpers ============

const responseBuilder = createResponseBuilder();

function buildValidationDetails(
  details: { field?: string; message: string }[],
): ResultErrorDetail[] {
  return details.map((detail) => ({
    field: detail.field,
    code: 'INVALID_FIELD',
    message: detail.message,
  }));
}

function respondWithResult<T>(res: Response, result: Result<T>, okStatus = 200) {
  if (isOk(result as any)) {
    res.status(okStatus).json(responseBuilder.success(result.data as T));
    return;
  }

  const status = errorCodeToHttpStatus(result.error?.code ?? 'INTERNAL_ERROR');
  res.status(status).json(responseBuilder.fromResult(result as any));
}

// ============ Route Registration ============

export function registerTaskTemplateRoutes(
  controller: TaskTemplateController,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // POST / �?Create template
  router.post(
    '/',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const parsed = CreateTaskTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        res
          .status(400)
          .json(responseBuilder.validationError(buildValidationDetails(details)));
        return;
      }

      if (!req.user?.identityId) {
        res.status(401).json(responseBuilder.unauthorized());
        return;
      }

      const result = await controller.createTemplate(parsed.data, req.user.identityId);
      respondWithResult(res, result, 201);
    },
  );

  // GET / �?List templates
  router.get(
    '/',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      if (!req.user?.identityId) {
        res.status(401).json(responseBuilder.unauthorized());
        return;
      }

      const filters = {
        status: req.query.status as any,
        folderId: req.query.folderId as string,
        goalId: req.query.goalId as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      };

      const result = await controller.listTemplates(req.user.identityId, filters);
      respondWithResult(res, result);
    },
  );

  // GET /:id �?Get template by ID
  router.get(
    '/:id',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const includeChildren = req.query.includeChildren === 'true';
      const result = await controller.getTemplate(req.params.id, includeChildren);
      respondWithResult(res, result);
    },
  );

  // PUT /:id �?Update template
  router.put(
    '/:id',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const parsed = UpdateTaskTemplateSchema.safeParse(req.body);
      if (!parsed.success) {
        const details = parsed.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        res
          .status(400)
          .json(responseBuilder.validationError(buildValidationDetails(details)));
        return;
      }

      const result = await controller.updateTemplate(req.params.id, parsed.data);
      respondWithResult(res, result);
    },
  );

  // DELETE /:id �?Delete template
  router.delete(
    '/:id',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await controller.deleteTemplate(req.params.id);
      respondWithResult(res, result);
    },
  );

  // POST /:id/activate �?Activate template
  router.post(
    '/:id/activate',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await controller.activateTemplate(req.params.id);
      respondWithResult(res, result);
    },
  );

  // POST /:id/pause �?Pause template
  router.post(
    '/:id/pause',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await controller.pauseTemplate(req.params.id);
      respondWithResult(res, result);
    },
  );

  // POST /:id/archive �?Archive template
  router.post(
    '/:id/archive',
    auth,
    async (req: AuthenticatedRequest, res: Response) => {
      const result = await controller.archiveTemplate(req.params.id);
      respondWithResult(res, result);
    },
  );

  return router;
}
