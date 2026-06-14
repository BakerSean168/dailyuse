import { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';

import type { AILangGraphCheckpointController } from '../../controllers/ai-langgraph-checkpoint.controller';
import { registerAILangGraphCheckpointRoutes } from './ai-langgraph-checkpoint.routes';

type RouteHandler = (
  req: Record<string, unknown>,
  res: {
    status(code: number): unknown;
    json(data: unknown): unknown;
  },
) => unknown;

type LayerWithRoute = {
  route?: {
    path: string;
    methods: Record<string, boolean>;
    stack: Array<{ handle: RouteHandler }>;
  };
};

function createControllerStub(): AILangGraphCheckpointController {
  return {
    putCheckpoint: vi.fn(async () => undefined),
    getCheckpoint: vi.fn(async () => ({
        identityId: 'identity-1',
        agentType: 'goal.create',
        threadId: 'thread-1',
        checkpointNs: '',
        checkpointId: 'checkpoint-1',
        checkpoint: { type: 'json', data: 'YQ==' },
        metadata: { type: 'json', data: 'Yg==' },
        createdAt: '2026-06-13T00:00:00.000Z',
        pendingWrites: [],
      })),
    listCheckpoints: vi.fn(async () => []),
    putWrites: vi.fn(async () => undefined),
    deleteThread: vi.fn(async () => undefined),
  } as unknown as AILangGraphCheckpointController;
}

function getRouteHandler(router: Router, method: string, path: string): RouteHandler {
  const layer = (router as unknown as { stack: LayerWithRoute[] }).stack.find(
    (candidate) =>
      candidate.route?.path === path && candidate.route.methods[method.toLowerCase()] === true,
  );

  expect(layer?.route).toBeDefined();
  return layer!.route!.stack.at(-1)!.handle;
}

describe('registerAILangGraphCheckpointRoutes', () => {
  it('forwards checkpoint writes with identity and request id', async () => {
    const controller = createControllerStub();
    const router = registerAILangGraphCheckpointRoutes(controller, {
      auth: (_req, _res, next) => next(),
    });
    const handler = getRouteHandler(router, 'post', '/writes');
    const body = {
      agentType: 'goal.create',
      threadId: 'thread-1',
      checkpointNs: '',
      checkpointId: 'checkpoint-1',
      taskId: 'task-1',
      taskPath: '',
      writes: [{ idx: 0, channel: 'messages', value: { type: 'json', data: 'YQ==' } }],
    };
    const req = {
      body,
      user: { identityId: 'identity-route' },
      traceId: 'trace-langgraph-route-writes',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(controller.putWrites).toHaveBeenCalledWith({
      identityId: 'identity-route',
      agentType: 'goal.create',
      threadId: 'thread-1',
      checkpointNs: '',
      checkpointId: 'checkpoint-1',
      taskId: 'task-1',
      taskPath: '',
      writes: [{ idx: 0, channel: 'messages', value: { type: 'json', data: 'YQ==' } }],
      requestId: 'trace-langgraph-route-writes',
    });
    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('forwards head query params to the controller', async () => {
    const controller = createControllerStub();
    const router = registerAILangGraphCheckpointRoutes(controller, {
      auth: (_req, _res, next) => next(),
    });
    const handler = getRouteHandler(router, 'get', '/head');
    const req = {
      query: {
        agentType: 'knowledge.generate',
        threadId: 'thread-2',
        checkpointNs: 'approval',
        checkpointId: 'checkpoint-9',
      },
      user: { identityId: 'identity-route' },
      id: 'request-langgraph-head',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(controller.getCheckpoint).toHaveBeenCalledWith({
      identityId: 'identity-route',
      agentType: 'knowledge.generate',
      threadId: 'thread-2',
      checkpointNs: 'approval',
      checkpointId: 'checkpoint-9',
      requestId: 'request-langgraph-head',
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 404 when the checkpoint does not exist', async () => {
    const controller = createControllerStub();
    vi.mocked(controller.getCheckpoint).mockResolvedValueOnce(null);
    const router = registerAILangGraphCheckpointRoutes(controller, {
      auth: (_req, _res, next) => next(),
    });
    const handler = getRouteHandler(router, 'get', '/head');
    const req = {
      query: {
        agentType: 'goal.create',
        threadId: 'thread-missing',
      },
      user: { identityId: 'identity-route' },
      id: 'request-langgraph-missing',
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
