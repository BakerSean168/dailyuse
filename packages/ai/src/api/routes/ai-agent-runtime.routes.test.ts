import { Router } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { AgentRunResultSchema, type AgentEvent } from '@memoflow/contracts/ai';
import { ok } from '@memoflow/contracts/result';
import type { AIAgentRuntimeController } from '../../server/transport/ai-agent-runtime.controller';
import { registerAIAgentRuntimeRoutes } from './ai-agent-runtime.routes';

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

function createRunResult() {
  return AgentRunResultSchema.parse({
    run: {
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      identityId: 'identity-1',
      agentType: 'goal.create',
      status: 'waiting_approval',
      createdAt: 1,
      updatedAt: 2,
    },
    state: {
      stage: 'approval',
      intent: 'goal-create',
      pendingActions: [{ tool: 'create_goal', index: 0, rationale: null }],
    },
    events: [],
    interrupts: [],
  });
}

function createControllerStub(): AIAgentRuntimeController {
  return {
    listRuns: vi.fn(async () => ok([createRunResult().run])),
    startRun: vi.fn(async () => ok(createRunResult())),
    resumeRun: vi.fn(async () => ok(createRunResult())),
    getRun: vi.fn(async () => ok(createRunResult())),
    getEvents: vi.fn(async () => ok([] as AgentEvent[])),
  } as unknown as AIAgentRuntimeController;
}

function getRouteHandler(router: Router, method: string, path: string): RouteHandler {
  const layer = (router as unknown as { stack: LayerWithRoute[] }).stack.find(
    (candidate) =>
      candidate.route?.path === path && candidate.route.methods[method.toLowerCase()] === true,
  );

  expect(layer?.route).toBeDefined();
  return layer!.route!.stack.at(-1)!.handle;
}

describe('registerAIAgentRuntimeRoutes', () => {
  it('forwards run list query, identity, and request id', async () => {
    const controller = createControllerStub();
    const router = registerAIAgentRuntimeRoutes(controller, {
      auth: (_req, _res, next) => next(),
    });
    const handler = getRouteHandler(router, 'get', '/runs');
    const query = {
      conversationId: 'conversation-1',
      status: ['waiting_approval', 'waiting_execution'],
      activeOnly: 'true',
      limit: '5',
    };
    const req = {
      query,
      user: { identityId: 'identity-route' },
      requestContext: {
        requestId: 'trace-agent-route-list',
        traceId: 'trace-agent-route-list',
        startedAt: 1_700_000_000_000,
        source: 'http',
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(controller.listRuns).toHaveBeenCalledWith(
      query,
      expect.objectContaining({
        identityId: 'identity-route',
        requestId: 'trace-agent-route-list',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: [expect.objectContaining({ runId: 'run-1' })],
      }),
    );
  });

  it('registers the start endpoint and returns 201 for created runs', async () => {
    const controller = createControllerStub();
    const router = registerAIAgentRuntimeRoutes(controller, {
      auth: (_req, _res, next) => next(),
    });
    const handler = getRouteHandler(router, 'post', '/runs');
    const body = {
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      agentType: 'goal.create',
      locale: 'en-US',
      input: { idea: 'Ship the AI agent runtime.' },
    };
    const req = {
      body,
      user: { identityId: 'identity-route' },
      requestContext: {
        requestId: 'trace-agent-route-1',
        traceId: 'trace-agent-route-1',
        startedAt: 1_700_000_000_000,
        source: 'http',
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(controller.startRun).toHaveBeenCalledWith(
      body,
      expect.objectContaining({ identityId: 'identity-route', requestId: 'trace-agent-route-1' }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        ok: true,
        data: expect.objectContaining({
          run: expect.objectContaining({ runId: 'run-1' }),
        }),
      }),
    );
  });

  it('forwards resume route params, body, identity, and request id', async () => {
    const controller = createControllerStub();
    const router = registerAIAgentRuntimeRoutes(controller, {
      auth: (_req, _res, next) => next(),
    });
    const handler = getRouteHandler(router, 'post', '/runs/:runId/resume');
    const body = {
      userDecision: 'confirm',
      approvedActions: [{ tool: 'create_goal', index: 0 }],
    };
    const req = {
      body,
      params: { runId: 'run-1' },
      user: { identityId: 'identity-route' },
      requestContext: {
        requestId: 'request-agent-route-2',
        traceId: 'request-agent-route-2',
        startedAt: 1_700_000_000_000,
        source: 'http',
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(controller.resumeRun).toHaveBeenCalledWith(
      'run-1',
      body,
      expect.objectContaining({ identityId: 'identity-route', requestId: 'request-agent-route-2' }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forwards run lookup route params, identity, and request id', async () => {
    const controller = createControllerStub();
    const router = registerAIAgentRuntimeRoutes(controller, {
      auth: (_req, _res, next) => next(),
    });
    const handler = getRouteHandler(router, 'get', '/runs/:runId');
    const req = {
      params: { runId: 'run-1' },
      user: { identityId: 'identity-route' },
      requestContext: {
        requestId: 'trace-agent-route-lookup',
        traceId: 'trace-agent-route-lookup',
        startedAt: 1_700_000_000_000,
        source: 'http',
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(controller.getRun).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({
        identityId: 'identity-route',
        requestId: 'trace-agent-route-lookup',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('forwards event lookup route params and identity', async () => {
    const controller = createControllerStub();
    const router = registerAIAgentRuntimeRoutes(controller, {
      auth: (_req, _res, next) => next(),
    });
    const handler = getRouteHandler(router, 'get', '/runs/:runId/events');
    const req = {
      params: { runId: 'run-1' },
      user: { identityId: 'identity-route' },
      requestContext: {
        requestId: 'trace-agent-route-3',
        traceId: 'trace-agent-route-3',
        startedAt: 1_700_000_000_000,
        source: 'http',
      },
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    await handler(req, res);

    expect(controller.getEvents).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({ identityId: 'identity-route', requestId: 'trace-agent-route-3' }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
