import { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';

import type { AIGoalAutomationController } from '../controllers/ai-goal-automation.controller';
import { registerAIGoalAutomationRoutes } from './ai-goal-automation.routes';

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

describe('registerAIGoalAutomationRoutes', () => {
  it('registers the goal automation endpoint and forwards the request to the controller', async () => {
    const controller = {
      automateGoal: vi.fn(async () => ({ ok: true, data: { ok: true } })),
    } as unknown as AIGoalAutomationController;

    const router = registerAIGoalAutomationRoutes(controller, {
      auth: ((_, __, next) => next()) as any,
    });
    const handler = getRouteHandler(router, 'post', '/goal-automation');

    const req = {
      body: { idea: 'Plan and approve goal automation.' },
      user: { identityId: 'identity-1' },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    await handler(req, res);

    expect(controller.automateGoal).toHaveBeenCalledWith(req.body, 'identity-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: { ok: true },
      }),
    );
  });
});
