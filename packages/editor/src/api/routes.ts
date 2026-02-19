/**
 * Editor API Routes
 *
 * Route definitions and request handling for editor module.
 * Uses inline validation since editor contracts use plain TypeScript interfaces.
 */

import { Router } from 'express';
import type { Request, Response, RequestHandler } from 'express';
import type {
  CreateEditorWorkspaceRequest,
  UpdateEditorWorkspaceRequest,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from '@dailyuse/contracts/editor';
import { createExpressHelper } from '@dailyuse/utils/result';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('EditorRoutes');

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

function getIdentityId(req: AuthenticatedRequest): string | null {
  return req.user?.identityId ?? null;
}

export function registerEditorRoutes(
  handlers: EditorRouteHandlers,
  middleware: PlatformMiddleware,
): Router {
  const router = Router();
  const { auth } = middleware;

  // ============ Workspace Routes ============

  router.post('/workspaces', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const identityId = getIdentityId(req);
      if (!identityId) return helper.unauthorized();

      const { name, projectPath, projectType } = req.body;
      if (!name || typeof name !== 'string') {
        return helper.validationError('name is required');
      }
      if (!projectPath || typeof projectPath !== 'string') {
        return helper.validationError('projectPath is required');
      }
      if (!projectType || typeof projectType !== 'string') {
        return helper.validationError('projectType is required');
      }

      const result = await handlers.createWorkspace(identityId, req.body);
      return helper.created(result);
    } catch (error) {
      logger.error('Create workspace failed:', error);
      return helper.internalError(error instanceof Error ? error.message : 'Create workspace failed');
    }
  });

  router.get('/workspaces', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const identityId = getIdentityId(req);
      if (!identityId) return helper.unauthorized();

      const result = await handlers.listWorkspaces(identityId);
      return helper.success(result);
    } catch (error) {
      logger.error('List workspaces failed:', error);
      return helper.internalError(error instanceof Error ? error.message : 'List workspaces failed');
    }
  });

  router.get('/workspaces/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const identityId = getIdentityId(req);
      if (!identityId) return helper.unauthorized();

      const result = await handlers.getWorkspace(req.params.id);
      if (!result) return helper.notFound('Workspace not found');
      return helper.success(result);
    } catch (error) {
      logger.error('Get workspace failed:', error);
      return helper.internalError(error instanceof Error ? error.message : 'Get workspace failed');
    }
  });

  router.put('/workspaces/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const identityId = getIdentityId(req);
      if (!identityId) return helper.unauthorized();

      const result = await handlers.updateWorkspace(req.params.id, req.body);
      if (!result) return helper.notFound('Workspace not found');
      return helper.success(result);
    } catch (error) {
      logger.error('Update workspace failed:', error);
      return helper.internalError(error instanceof Error ? error.message : 'Update workspace failed');
    }
  });

  router.delete('/workspaces/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const identityId = getIdentityId(req);
      if (!identityId) return helper.unauthorized();

      await handlers.deleteWorkspace(req.params.id);
      return helper.success(null, 'Workspace deleted');
    } catch (error) {
      logger.error('Delete workspace failed:', error);
      return helper.internalError(error instanceof Error ? error.message : 'Delete workspace failed');
    }
  });

  // ============ Document Routes ============

  router.post('/documents', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const identityId = getIdentityId(req);
      if (!identityId) return helper.unauthorized();

      const { workspaceId, name } = req.body;
      if (!workspaceId || typeof workspaceId !== 'string') {
        return helper.validationError('workspaceId is required');
      }
      if (!name || typeof name !== 'string') {
        return helper.validationError('name is required');
      }

      const result = await handlers.createDocument(identityId, req.body);
      return helper.created(result);
    } catch (error) {
      logger.error('Create document failed:', error);
      return helper.internalError(error instanceof Error ? error.message : 'Create document failed');
    }
  });

  router.get('/documents', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const identityId = getIdentityId(req);
      if (!identityId) return helper.unauthorized();

      const workspaceId = req.query.workspaceId as string | undefined;
      const folderId = req.query.folderId as string | undefined;

      const result = await handlers.listDocuments({ workspaceId, folderId, identityId });
      return helper.success(result);
    } catch (error) {
      logger.error('List documents failed:', error);
      return helper.internalError(error instanceof Error ? error.message : 'List documents failed');
    }
  });

  router.get('/documents/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const identityId = getIdentityId(req);
      if (!identityId) return helper.unauthorized();

      const result = await handlers.getDocument(req.params.id);
      if (!result) return helper.notFound('Document not found');
      return helper.success(result);
    } catch (error) {
      logger.error('Get document failed:', error);
      return helper.internalError(error instanceof Error ? error.message : 'Get document failed');
    }
  });

  router.put('/documents/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const identityId = getIdentityId(req);
      if (!identityId) return helper.unauthorized();

      const result = await handlers.updateDocument(req.params.id, req.body);
      if (!result) return helper.notFound('Document not found');
      return helper.success(result);
    } catch (error) {
      logger.error('Update document failed:', error);
      return helper.internalError(error instanceof Error ? error.message : 'Update document failed');
    }
  });

  router.delete('/documents/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
    const helper = createExpressHelper(res, req);
    try {
      const identityId = getIdentityId(req);
      if (!identityId) return helper.unauthorized();

      await handlers.deleteDocument(req.params.id);
      return helper.success(null, 'Document deleted');
    } catch (error) {
      logger.error('Delete document failed:', error);
      return helper.internalError(error instanceof Error ? error.message : 'Delete document failed');
    }
  });

  return router;
}
