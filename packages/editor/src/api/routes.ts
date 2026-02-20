/**
 * Editor API Routes
 *
 * Route definitions and request handling for editor module.
 * Uses expressAdapter to eliminate boilerplate code.
 *
 * Routes:
 *   POST   /workspaces          — Create workspace
 *   GET    /workspaces          — List workspaces
 *   GET    /workspaces/:id      — Get workspace by ID
 *   PUT    /workspaces/:id      — Update workspace
 *   DELETE /workspaces/:id      — Delete workspace
 *   POST   /documents           — Create document
 *   GET    /documents           — List documents
 *   GET    /documents/:id       — Get document by ID
 *   PUT    /documents/:id       — Update document
 *   DELETE /documents/:id       — Delete document
 */

import { Router } from 'express';
import type { RequestHandler } from 'express';
import { expressAdapter } from '@dailyuse/utils/result';
import { EditorController } from '../controllers/editor.controller';
import type { EditorUseCases } from '../controllers/editor.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerEditorRoutes(
  handlers: EditorUseCases,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new EditorController(handlers);

  // ============ Workspace Routes ============

  router.post('/workspaces', auth, expressAdapter(
    (req, ctx) => controller.createWorkspace(req.body, ctx),
    { successStatus: 201 },
  ));

  router.get('/workspaces', auth, expressAdapter(
    (_req, ctx) => controller.listWorkspaces(ctx),
  ));

  router.get('/workspaces/:id', auth, expressAdapter(
    (req) => controller.getWorkspace(req.params!.id),
  ));

  router.put('/workspaces/:id', auth, expressAdapter(
    (req) => controller.updateWorkspace(req.params!.id, req.body),
  ));

  router.delete('/workspaces/:id', auth, expressAdapter(
    (req) => controller.deleteWorkspace(req.params!.id),
  ));

  // ============ Document Routes ============

  router.post('/documents', auth, expressAdapter(
    (req, ctx) => controller.createDocument(req.body, ctx),
    { successStatus: 201 },
  ));

  router.get('/documents', auth, expressAdapter(
    (req, ctx) => controller.listDocuments({
      workspaceId: req.query?.workspaceId as string | undefined,
      folderId: req.query?.folderId as string | undefined,
    }, ctx),
  ));

  router.get('/documents/:id', auth, expressAdapter(
    (req) => controller.getDocument(req.params!.id),
  ));

  router.put('/documents/:id', auth, expressAdapter(
    (req) => controller.updateDocument(req.params!.id, req.body),
  ));

  router.delete('/documents/:id', auth, expressAdapter(
    (req) => controller.deleteDocument(req.params!.id),
  ));

  return router;
}
