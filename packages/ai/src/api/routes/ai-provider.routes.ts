import { Router, type RequestHandler } from 'express';
import type { OpenApiRegistryLike } from '@dailyuse/utils/result';
import type { AIProviderConfigController } from '../controllers/ai-provider-config.controller';

interface PlatformMiddleware {
  readonly auth: RequestHandler;
}

export function registerAIProviderRoutes(
  controller: AIProviderConfigController,
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
  router.patch('/:id', auth, (req, res, next) =>
    controller.update(req.params.id, req.body).then(res.json.bind(res)).catch(next),
  );
  router.get('/', auth, (req, res, next) =>
    controller
      .list((req as any).identityId)
      .then(res.json.bind(res))
      .catch(next),
  );
  router.get('/:id', auth, (req, res, next) =>
    controller.get(req.params.id).then(res.json.bind(res)).catch(next),
  );
  router.delete('/:id', auth, (req, res, next) =>
    controller.delete(req.params.id).then(res.json.bind(res)).catch(next),
  );
  router.post('/test', auth, (req, res, next) =>
    controller.test(req.body).then(res.json.bind(res)).catch(next),
  );
  router.post('/:id/set-default', auth, (req, res, next) =>
    controller
      .setDefault(req.params.id, (req as any).identityId)
      .then(res.json.bind(res))
      .catch(next),
  );

  return router;
}
