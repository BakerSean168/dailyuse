/**
 * Repository API Routes
 *
 * Inline validation (no Zod schemas — contracts are plain interfaces).
 * All routes require auth middleware.
 */

import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import { createExpressHelper } from '@dailyuse/utils/result';

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

export interface RepositoryRouteHandlers {
  // Repository CRUD
  createRepository(identityId: string, data: { name: string; type: string; path?: string; description?: string; config?: Record<string, unknown> }): Promise<unknown>;
  listRepositories(identityId: string, filters: { status?: string; type?: string }): Promise<unknown>;
  getRepository(id: string): Promise<unknown>;
  updateRepository(id: string, data: { name?: string; description?: string; config?: Record<string, unknown> }): Promise<unknown>;
  deleteRepository(id: string): Promise<unknown>;
  archiveRepository(id: string): Promise<unknown>;
  activateRepository(id: string): Promise<unknown>;

  // Resource CRUD
  createResource(data: { repositoryId: string; name: string; type: string; mimeType?: string; content?: string; folderId?: string }): Promise<unknown>;
  listResources(repositoryId: string, filters: { folderId?: string; status?: string }): Promise<unknown>;
  getResource(id: string): Promise<unknown>;
  updateResource(id: string, data: { name?: string; content?: string; metadata?: Record<string, unknown> }): Promise<unknown>;
  deleteResource(id: string): Promise<unknown>;
}

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerRepositoryRoutes(
  handlers: RepositoryRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // ── Repository CRUD ──────────────────────────────────────────────

  // POST /repositories — Create repository
  router.post('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const { name, type } = req.body;
      if (!name || typeof name !== 'string') return helper.validationError('name is required');
      if (!type || typeof type !== 'string') return helper.validationError('type is required');

      const result = await handlers.createRepository(req.user.identityId, req.body);
      return helper.created(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Create repository failed';
      return helper.internalError(message);
    }
  });

  // GET /repositories — List repositories
  router.get('/', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const type = typeof req.query.type === 'string' ? req.query.type : undefined;

      const result = await handlers.listRepositories(req.user.identityId, { status, type });
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'List repositories failed';
      return helper.internalError(message);
    }
  });

  // GET /repositories/:id — Get repository by ID
  router.get('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const result = await handlers.getRepository(req.params.id);
      if (!result) return helper.notFound('Repository not found');
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Get repository failed';
      return helper.internalError(message);
    }
  });

  // PUT /repositories/:id — Update repository
  router.put('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const result = await handlers.updateRepository(req.params.id, req.body);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update repository failed';
      return helper.internalError(message);
    }
  });

  // DELETE /repositories/:id — Delete repository
  router.delete('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      await handlers.deleteRepository(req.params.id);
      return helper.success(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete repository failed';
      return helper.internalError(message);
    }
  });

  // POST /repositories/:id/archive — Archive repository
  router.post('/:id/archive', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const result = await handlers.archiveRepository(req.params.id);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Archive repository failed';
      return helper.internalError(message);
    }
  });

  // POST /repositories/:id/activate — Activate repository
  router.post('/:id/activate', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const result = await handlers.activateRepository(req.params.id);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Activate repository failed';
      return helper.internalError(message);
    }
  });

  // ── Resource CRUD ────────────────────────────────────────────────

  // POST /repositories/:repoId/resources — Create resource
  router.post('/:repoId/resources', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const { name, type } = req.body;
      if (!name || typeof name !== 'string') return helper.validationError('name is required');
      if (!type || typeof type !== 'string') return helper.validationError('type is required');

      const result = await handlers.createResource({
        ...req.body,
        repositoryId: req.params.repoId,
      });
      return helper.created(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Create resource failed';
      return helper.internalError(message);
    }
  });

  // GET /repositories/:repoId/resources — List resources
  router.get('/:repoId/resources', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const folderId = typeof req.query.folderId === 'string' ? req.query.folderId : undefined;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;

      const result = await handlers.listResources(req.params.repoId, { folderId, status });
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'List resources failed';
      return helper.internalError(message);
    }
  });

  return router;
}

/**
 * Standalone resource routes (not nested under /repositories).
 * Mounted at /resources by the module.
 */
export function registerResourceRoutes(
  handlers: RepositoryRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // GET /resources/:id — Get resource by ID
  router.get('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const result = await handlers.getResource(req.params.id);
      if (!result) return helper.notFound('Resource not found');
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Get resource failed';
      return helper.internalError(message);
    }
  });

  // PUT /resources/:id — Update resource
  router.put('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      const result = await handlers.updateResource(req.params.id, req.body);
      return helper.success(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update resource failed';
      return helper.internalError(message);
    }
  });

  // DELETE /resources/:id — Delete resource
  router.delete('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      if (!req.user?.identityId) return helper.unauthorized();

      await handlers.deleteResource(req.params.id);
      return helper.success(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Delete resource failed';
      return helper.internalError(message);
    }
  });

  return router;
}
