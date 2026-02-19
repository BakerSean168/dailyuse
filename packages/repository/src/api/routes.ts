/**
 * Repository API Routes
 *
 * Uses expressAdapter to eliminate boilerplate code.
 *
 * Routes (Repositories):
 *   POST   /                   — Create repository
 *   GET    /                   — List repositories
 *   GET    /:id                — Get repository by ID
 *   PUT    /:id                — Update repository
 *   DELETE /:id                — Delete repository
 *   POST   /:id/archive        — Archive repository
 *   POST   /:id/activate       — Activate repository
 *   POST   /:repoId/resources  — Create resource
 *   GET    /:repoId/resources  — List resources
 *
 * Routes (Resources - standalone):
 *   GET    /:id                — Get resource by ID
 *   PUT    /:id                — Update resource
 *   DELETE /:id                — Delete resource
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import { RepositoryController } from './controller';

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
  const controller = new RepositoryController(handlers);

  // ── Repository CRUD ──────────────────────────────────────────────

  router.post('/', auth, expressAdapter(
    (req, ctx) => controller.createRepository(ctx.identityId, req.body),
    { successStatus: 201 },
  ));

  router.get('/', auth, expressAdapter(
    (req, ctx) => controller.listRepositories(ctx.identityId, {
      status: typeof req.query?.status === 'string' ? req.query.status : undefined,
      type: typeof req.query?.type === 'string' ? req.query.type : undefined,
    }),
  ));

  router.get('/:id', auth, expressAdapter(
    (req) => controller.getRepository(req.params!.id),
  ));

  router.put('/:id', auth, expressAdapter(
    (req) => controller.updateRepository(req.params!.id, req.body),
  ));

  router.delete('/:id', auth, expressAdapter(
    (req) => controller.deleteRepository(req.params!.id),
  ));

  router.post('/:id/archive', auth, expressAdapter(
    (req) => controller.archiveRepository(req.params!.id),
  ));

  router.post('/:id/activate', auth, expressAdapter(
    (req) => controller.activateRepository(req.params!.id),
  ));

  // ── Nested Resource Routes ───────────────────────────────────────

  router.post('/:repoId/resources', auth, expressAdapter(
    (req) => controller.createResource(req.params!.repoId, req.body),
    { successStatus: 201 },
  ));

  router.get('/:repoId/resources', auth, expressAdapter(
    (req) => controller.listResources(req.params!.repoId, {
      folderId: typeof req.query?.folderId === 'string' ? req.query.folderId : undefined,
      status: typeof req.query?.status === 'string' ? req.query.status : undefined,
    }),
  ));

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
  const controller = new RepositoryController(handlers);

  router.get('/:id', auth, expressAdapter(
    (req) => controller.getResource(req.params!.id),
  ));

  router.put('/:id', auth, expressAdapter(
    (req) => controller.updateResource(req.params!.id, req.body),
  ));

  router.delete('/:id', auth, expressAdapter(
    (req) => controller.deleteResource(req.params!.id),
  ));

  return router;
}
