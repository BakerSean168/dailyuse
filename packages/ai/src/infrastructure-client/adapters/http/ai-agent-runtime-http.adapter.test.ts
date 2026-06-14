import { describe, expect, it, vi } from 'vitest';

import {
  AgentRunResultSchema,
  type AgentEvent,
  type AgentRun,
  type AgentResumePayload,
  type AgentStartRunClientRequest,
} from '@dailyuse/contracts/ai';
import { ok } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '../types';
import { AIAgentRuntimeHttpAdapter } from './ai-agent-runtime-http.adapter';

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

function createHttpClientStub(overrides?: Partial<IResultHttpClient>): IResultHttpClient {
  return {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    stream: vi.fn(),
    ...overrides,
  };
}

describe('AIAgentRuntimeHttpAdapter', () => {
  it('uses the agent runtime HTTP endpoints and encodes run ids', async () => {
    const runResult = createRunResult();
    const events: AgentEvent[] = [
      {
        eventId: 'event-1',
        runId: 'run 1/2',
        sequence: 0,
        type: 'run.started',
        createdAt: 1,
        data: {},
      },
    ];
    const runs: AgentRun[] = [runResult.run];
    const post = vi.fn().mockResolvedValue(ok(runResult));
    const get = vi.fn()
      .mockResolvedValueOnce(ok(runs))
      .mockResolvedValueOnce(ok(runResult))
      .mockResolvedValueOnce(ok(events));
    const httpClient = createHttpClientStub({ post, get });
    const adapter = new AIAgentRuntimeHttpAdapter(httpClient);
    const request: AgentStartRunClientRequest = {
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      agentType: 'goal.create',
      input: { idea: 'Ship the AI agent runtime.' },
    };
    const payload: AgentResumePayload = {
      userDecision: 'confirm',
      approvedActions: [{ tool: 'create_goal', index: 0 }],
    };

    await expect(adapter.startAgentRun(request)).resolves.toEqual(runResult);
    await expect(adapter.resumeAgentRun('run 1/2', payload)).resolves.toEqual(runResult);
    await expect(
      adapter.listAgentRuns({
        conversationId: 'conversation-1',
        status: ['waiting_approval'],
        activeOnly: true,
        limit: 5,
      }),
    ).resolves.toEqual(runs);
    await expect(adapter.getAgentRun('run 1/2')).resolves.toEqual(runResult);
    await expect(adapter.getAgentEvents('run 1/2')).resolves.toEqual(events);

    expect(post).toHaveBeenNthCalledWith(1, '/ai/agents/runs', request);
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/ai/agents/runs/run%201%2F2/resume',
      payload,
    );
    expect(get).toHaveBeenNthCalledWith(
      1,
      '/ai/agents/runs?conversationId=conversation-1&status=waiting_approval&activeOnly=true&limit=5',
    );
    expect(get).toHaveBeenNthCalledWith(2, '/ai/agents/runs/run%201%2F2');
    expect(get).toHaveBeenNthCalledWith(3, '/ai/agents/runs/run%201%2F2/events');
  });
});
