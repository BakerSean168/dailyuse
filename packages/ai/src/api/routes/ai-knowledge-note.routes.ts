import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { AIKnowledgeNoteController } from '../controllers/ai-knowledge-note.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
}

export function registerAIKnowledgeNoteRoutes(
  controller: AIKnowledgeNoteController,
  middleware: PlatformMiddleware,
  _openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  router.post('/', auth, (req, res, next) =>
    controller
      .create(req.body, (req as any).identityId)
      .then(res.json.bind(res))
      .catch(next),
  );

  return router;
}
