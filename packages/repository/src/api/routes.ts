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
import { RepositoryController } from '../controllers/repository.controller';
import type { RepositoryUseCases } from '../controllers/repository.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerRepositoryRoutes(
  handlers: RepositoryUseCases,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new RepositoryController(handlers);

  // ── Repository CRUD ──────────────────────────────────────────────

  router.post('/', auth, expressAdapter(
    (req, ctx) => controller.createRepository(req.body, ctx),
    { successStatus: 201 },
  ));

  router.get('/', auth, expressAdapter(
    (req, ctx) => controller.listRepositories({
      status: typeof req.query?.status === 'string' ? req.query.status : undefined,
      type: typeof req.query?.type === 'string' ? req.query.type : undefined,
    }, ctx),
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
  handlers: RepositoryUseCases,
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
