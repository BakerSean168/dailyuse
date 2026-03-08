import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { AIChatController } from '../controllers/ai-chat.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
}

export function registerAIChatRoutes(
  controller: AIChatController,
  middleware: PlatformMiddleware,
  _openApiRegistry?: OpenApiRegistryLike | null,
): Router {
  const router = Router();
  const { auth } = middleware;

  router.post('/conversations', auth, (req, res, next) =>
    controller
      .createConversation(req.body, (req as any).identityId)
      .then(res.json.bind(res))
      .catch(next),
  );
  router.get('/conversations', auth, (req, res, next) =>
    controller
      .listConversations(
        (req as any).identityId,
        Number(req.query.page ?? 1),
        Number(req.query.pageSize ?? 20),
      )
      .then(res.json.bind(res))
      .catch(next),
  );
  router.get('/conversations/:id', auth, (req, res, next) =>
    controller.getConversation(req.params.id).then(res.json.bind(res)).catch(next),
  );
  router.patch('/conversations/:id', auth, (req, res, next) =>
    controller.updateConversation(req.params.id, req.body).then(res.json.bind(res)).catch(next),
  );
  router.delete('/conversations/:id', auth, (req, res, next) =>
    controller.deleteConversation(req.params.id).then(res.json.bind(res)).catch(next),
  );
  router.post('/messages', auth, (req, res, next) =>
    controller
      .sendMessage(req.body, (req as any).identityId)
      .then(res.json.bind(res))
      .catch(next),
  );
  router.get('/messages', auth, (req, res, next) =>
    controller.listMessages(req.query).then(res.json.bind(res)).catch(next),
  );

  return router;
}
