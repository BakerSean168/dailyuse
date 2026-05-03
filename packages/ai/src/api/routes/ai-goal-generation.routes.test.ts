import { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';

import type { AIGoalGenerationController } from '../../controllers/ai-goal-generation.controller';
import { registerAIGoalGenerationRoutes } from './ai-goal-generation.routes';

type LayerWithRoute = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: (req: any, res: any) => unknown }>;
  };
};

function getRouteHandler(router: Router, method: string, path: string) {
  const layer = (router as unknown as { stack: LayerWithRoute[] }).stack.find(
    (candidate) =>
      candidate.route?.path === path && candidate.route.methods[method.toLowerCase()] === true,
  );

  expect(layer?.route).toBeDefined();
  return layer!.route!.stack.at(-1)!.handle;
}

describe('registerAIGoalGenerationRoutes', () => {
  it('registers the goal generation endpoint and forwards the request to the controller', async () => {
    const controller = {
      generateGoal: vi.fn(async () => ({ ok: true, data: { ok: true } })),
    } as unknown as AIGoalGenerationController;

    const router = registerAIGoalGenerationRoutes(controller, {
      auth: ((_, __, next) => next()) as any,
    });
    const handler = getRouteHandler(router, 'post', '/goal');

    const req = {
      body: { idea: 'Build a unified AI workflow for goal creation.' },
      user: { identityId: 'identity-1' },
      traceId: 'trace-goal-route-1',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    await handler(req, res);

    expect(controller.generateGoal).toHaveBeenCalledWith(
      req.body,
      'identity-1',
      'trace-goal-route-1',
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: { ok: true },
      }),
    );
  });
});
