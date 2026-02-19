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
import type {
  CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceRequest,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '@dailyuse/contracts/editor';
import { expressAdapter } from '@dailyuse/utils/result';
import { EditorController } from './controller';

export interface EditorRouteHandlers {
  createWorkspace: (identityId: string, data: CreateEditorWorkspaceRequest) => Promise<any>;
  listWorkspaces: (identityId: string) => Promise<any>;
  getWorkspace: (id: string) => Promise<any>;
  updateWorkspace: (id: string, data: UpdateEditorWorkspaceRequest) => Promise<any>;
  deleteWorkspace: (id: string) => Promise<any>;
  createDocument: (identityId: string, data: CreateDocumentRequest) => Promise<any>;
  listDocuments: (params: { workspaceId?: string; folderId?: string; identityId: string }) => Promise<any>;
  getDocument: (id: string) => Promise<any>;
  updateDocument: (id: string, data: UpdateDocumentRequest) => Promise<any>;
  deleteDocument: (id: string) => Promise<any>;
}

interface PlatformMiddleware {
  readonly auth: RequestHandler;
  requireRole(roles: string[]): RequestHandler;
}

export function registerEditorRoutes(
  handlers: EditorRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;
  const controller = new EditorController(handlers);

  // ============ Workspace Routes ============

  router.post('/workspaces', auth, expressAdapter(
    (req, ctx) => controller.createWorkspace(req.body, ctx.identityId),
    { successStatus: 201 },
  ));

  router.get('/workspaces', auth, expressAdapter(
    (_req, ctx) => controller.listWorkspaces(ctx.identityId),
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
    (req, ctx) => controller.createDocument(req.body, ctx.identityId),
    { successStatus: 201 },
  ));

  router.get('/documents', auth, expressAdapter(
    (req, ctx) => controller.listDocuments(ctx.identityId, {
      workspaceId: req.query?.workspaceId as string | undefined,
      folderId: req.query?.folderId as string | undefined,
    }),
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
