import { describe, expect, it, vi } from 'vitest';

import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type {
  AgentEvent,
  AgentRun,
  AgentResumePayload,
  AgentRunResult,
  AgentStartRunRequest,
} from '@dailyuse/contracts/ai';
import { AgentRunResultSchema } from '@dailyuse/contracts/ai';
import { ok } from '@dailyuse/contracts/result';
import { AIAgentRuntimeController } from './ai-agent-runtime.controller';

const cx: ExecutionContext = { identityId: 'identity-auth' };

function createRunResult(identityId = cx.identityId): AgentRunResult {
  return AgentRunResultSchema.parse({
    run: {
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      identityId,
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

function createServiceStub() {
  return {
    listAgentRuns: vi.fn(async () => ok([createRunResult().run] as AgentRun[])),
    startAgentRun: vi.fn(async () => ok(createRunResult())),
    resumeAgentRun: vi.fn(async () => ok(createRunResult())),
    getAgentRun: vi.fn(async () => ok(createRunResult())),
    getAgentEvents: vi.fn(async () => ok([] as AgentEvent[])),
  };
}

describe('AIAgentRuntimeController', () => {
  it('returns a validation failure for malformed start requests', async () => {
    const service = createServiceStub();
    const controller = new AIAgentRuntimeController(service);

    const result = await controller.startRun({ threadId: 'thread-1' }, cx);

    expect(result.ok).toBe(false);
    expect(service.startAgentRun).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('derives start request identity from the authenticated context', async () => {
    const service = createServiceStub();
    const controller = new AIAgentRuntimeController(service);

    const input = {
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      identityId: 'identity-from-client',
      agentType: 'goal.create',
      input: { idea: 'Ship the AI agent runtime.' },
    };

    const result = await controller.startRun(input, cx, 'trace-agent-1');

    expect(result.ok).toBe(true);
    expect(service.startAgentRun).toHaveBeenCalledWith(
      {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'identity-auth',
        agentType: 'goal.create',
        input: { idea: 'Ship the AI agent runtime.' },
      } satisfies AgentStartRunRequest,
      cx,
      'trace-agent-1',
      undefined,
    );
  });

  it('validates resume payloads before calling the service', async () => {
    const service = createServiceStub();
    const controller = new AIAgentRuntimeController(service);

    const result = await controller.resumeRun(
      'run-1',
      { userDecision: 'approve' },
      cx,
      'trace-agent-2',
    );

    expect(result.ok).toBe(false);
    expect(service.resumeAgentRun).not.toHaveBeenCalled();
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });

  it('passes validated resume payloads through to the service', async () => {
    const service = createServiceStub();
    const controller = new AIAgentRuntimeController(service);
    const payload: AgentResumePayload = {
      userDecision: 'confirm',
      approvedPlan: {
        summary: 'Approved plan',
        actions: [{ tool: 'create_goal', index: 0 }],
      },
      approvedActions: [{ tool: 'create_goal', index: 0 }],
    };

    const result = await controller.resumeRun('run-1', payload, cx, 'trace-agent-3');

    expect(result.ok).toBe(true);
    expect(service.resumeAgentRun).toHaveBeenCalledWith(
      'run-1',
      expect.objectContaining({
        userDecision: 'confirm',
        approvedPlan: expect.objectContaining({ summary: 'Approved plan' }),
      }),
      cx,
      'trace-agent-3',
      undefined,
    );
  });

  it('passes validated run lookups through to the service', async () => {
    const service = createServiceStub();
    const controller = new AIAgentRuntimeController(service);

    const result = await controller.getRun('run-1', cx, 'trace-agent-lookup');

    expect(result.ok).toBe(true);
    expect(service.getAgentRun).toHaveBeenCalledWith(
      'run-1',
      cx,
      'trace-agent-lookup',
      undefined,
    );
  });

  it('normalizes run list query params before calling the service', async () => {
    const service = createServiceStub();
    const controller = new AIAgentRuntimeController(service);

    const result = await controller.listRuns(
      {
        conversationId: 'conversation-1',
        status: ['waiting_approval', 'waiting_execution'],
        activeOnly: 'true',
        limit: '5',
      },
      cx,
      'trace-agent-list',
    );

    expect(result.ok).toBe(true);
    expect(service.listAgentRuns).toHaveBeenCalledWith(
      {
        conversationId: 'conversation-1',
        status: ['waiting_approval', 'waiting_execution'],
        activeOnly: true,
        limit: 5,
      },
      cx,
      'trace-agent-list',
      undefined,
    );
  });
});
