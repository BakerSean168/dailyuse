import { describe, expect, it, vi } from 'vitest';

import { AIChannels } from '@dailyuse/contracts/electron';
import {
  AgentRunResultSchema,
  type AgentEvent,
  type AgentRun,
  type AgentResumePayload,
  type AgentStartRunClientRequest,
} from '@dailyuse/contracts/ai';
import { ok } from '@dailyuse/contracts/result';
import type { IResultIpcClient } from '../types';
import { AIAgentRuntimeIpcAdapter } from './ai-agent-runtime-ipc.adapter';

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

describe('AIAgentRuntimeIpcAdapter', () => {
  it('uses the typed agent runtime IPC channels and payload shapes', async () => {
    const runResult = createRunResult();
    const events: AgentEvent[] = [
      {
        eventId: 'event-1',
        runId: 'run-1',
        sequence: 0,
        type: 'run.started',
        createdAt: 1,
        data: {},
      },
    ];
    const runs: AgentRun[] = [runResult.run];
    const invoke = vi.fn()
      .mockResolvedValueOnce(ok(runs))
      .mockResolvedValueOnce(ok(runResult))
      .mockResolvedValueOnce(ok(runResult))
      .mockResolvedValueOnce(ok(runResult))
      .mockResolvedValueOnce(ok(events));
    const ipcClient: IResultIpcClient = { invoke };
    const adapter = new AIAgentRuntimeIpcAdapter(ipcClient);
    const request: AgentStartRunClientRequest = {
      runId: 'run-1',
      threadId: 'thread-1',
      conversationId: null,
      agentType: 'goal.create',
      locale: 'en-US',
      input: { idea: 'Ship the AI agent runtime.' },
    };
    const payload: AgentResumePayload = {
      userDecision: 'confirm',
      approvedActions: [{ tool: 'create_goal', index: 0 }],
    };

    await expect(adapter.listAgentRuns({ activeOnly: true, limit: 5 })).resolves.toEqual(runs);
    await expect(adapter.startAgentRun(request)).resolves.toEqual(runResult);
    await expect(adapter.resumeAgentRun('run-1', payload)).resolves.toEqual(runResult);
    await expect(adapter.getAgentRun('run-1')).resolves.toEqual(runResult);
    await expect(adapter.getAgentEvents('run-1')).resolves.toEqual(events);

    expect(invoke).toHaveBeenNthCalledWith(1, AIChannels.AGENT_RUN_LIST, {
      activeOnly: true,
      limit: 5,
    });
    expect(invoke).toHaveBeenNthCalledWith(2, AIChannels.AGENT_RUN_START, request);
    expect(invoke).toHaveBeenNthCalledWith(3, AIChannels.AGENT_RUN_RESUME, {
      runId: 'run-1',
      payload,
    });
    expect(invoke).toHaveBeenNthCalledWith(4, AIChannels.AGENT_RUN_GET, 'run-1');
    expect(invoke).toHaveBeenNthCalledWith(5, AIChannels.AGENT_EVENTS_GET, 'run-1');
  });
});
