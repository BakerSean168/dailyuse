/**
 * Task Template Routes
 *
 * Route registration for task template operations.
 * Follows ADR-021/022 split-route pattern.
 *
 * Uses expressAdapter to eliminate boilerplate code:
 * - Zod validation is handled by the TaskTemplateController
 * - Error handling is unified via the adapter
 * - Context extraction is automatic
 */

import { Router, type RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import type { TaskTemplateController } from '../controllers/task-template.controller';

// ============ Types ============

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole?(roles: string[]): RequestHandler;
}

// ============ Route Registration ============

export function registerTaskTemplateRoutes(
  controller: TaskTemplateController,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // POST / — Create template
  router.post('/', auth, expressAdapter(
    (req, ctx) => controller.createTemplate(req.body, ctx.identityId),
    { successStatus: 201 },
  ));

  // GET / — List templates
  router.get('/', auth, expressAdapter(
    (req, ctx) => controller.listTemplates(ctx.identityId, {
      status: req.query?.status as any,
      folderId: req.query?.folderId as string,
      goalId: req.query?.goalId as string,
      tags: req.query?.tags ? (req.query.tags as string).split(',') : undefined,
    }),
  ));

  // GET /:id — Get template by ID
  router.get('/:id', auth, expressAdapter(
    (req) => controller.getTemplate(req.params!.id, req.query?.includeChildren === 'true'),
    { requireAuth: false },
  ));

  // PUT /:id — Update template
  router.put('/:id', auth, expressAdapter(
    (req) => controller.updateTemplate(req.params!.id, req.body),
  ));

  // DELETE /:id — Delete template
  router.delete('/:id', auth, expressAdapter(
    (req) => controller.deleteTemplate(req.params!.id),
  ));

  // POST /:id/activate — Activate template
  router.post('/:id/activate', auth, expressAdapter(
    (req) => controller.activateTemplate(req.params!.id),
  ));

  // POST /:id/pause — Pause template
  router.post('/:id/pause', auth, expressAdapter(
    (req) => controller.pauseTemplate(req.params!.id),
  ));

  // POST /:id/archive — Archive template
  router.post('/:id/archive', auth, expressAdapter(
    (req) => controller.archiveTemplate(req.params!.id),
  ));

  return router;
}
