import { describe, expect, it, vi } from 'vitest';
import {
  knowledgeWriteRequirements,
  resolveRunPlan,
} from '@dailyuse/contracts/ai';
import type { IAgentRuntimePort } from '../../../application/ports';
import {
  LangGraphWorkflowAdapter,
  LANGGRAPH_WORKFLOW_ADAPTER_ID,
} from '../langgraph-workflow.adapter';

function createInnerRuntime(): IAgentRuntimePort {
  return {
    startRun: vi.fn().mockResolvedValue({
      run: {
        runId: 'run-1',
        threadId: 'thread-1',
        conversationId: null,
        identityId: 'id-1',
        agentType: 'goal.create',
        status: 'completed',
        createdAt: 1,
        updatedAt: 2,
      },
      state: {
        stage: 'result',
        intent: 'goal',
        messages: [],
        artifacts: [],
        citations: [],
        retrievedContext: [],
        pendingActions: [],
        approvedActions: [],
        executedActions: [],
        usage: {},
        errors: [],
      },
      events: [],
      interrupts: [],
    }),
    resumeRun: vi.fn().mockResolvedValue({} as never),
    listRuns: vi.fn().mockResolvedValue([]),
    getRun: vi.fn().mockResolvedValue({} as never),
    getEvents: vi.fn().mockResolvedValue([]),
  };
}

describe('LangGraphWorkflowAdapter', () => {
  it('exposes workflow.langgraph adapter id and engine/workflow kinds only', () => {
    const adapter = new LangGraphWorkflowAdapter(createInnerRuntime());
    expect(adapter.adapterId).toBe(LANGGRAPH_WORKFLOW_ADAPTER_ID);
    expect(adapter.offeredKinds).toEqual([
      'workflow.goal',
      'workflow.research',
      'engine.langgraph_workflow',
    ]);
    expect(adapter.offeredKinds).not.toContain('tool.mutation');
    expect(adapter.offeredKinds).not.toContain('tool.proposal');
    expect(adapter.offeredKinds).not.toContain('context.local_vault');
    expect(() => adapter.assertsNoMutationOffers()).not.toThrow();
  });

  it('delegates startRun to the inner IAgentRuntimePort', async () => {
    const inner = createInnerRuntime();
    const adapter = new LangGraphWorkflowAdapter(inner);
    const input = {
      request: {
        runId: 'run-1',
        threadId: 'thread-1',
        identityId: 'id-1',
        agentType: 'goal.create' as const,
        input: {},
      },
      requestId: 'req-1',
    };
    await adapter.startRun(input);
    expect(inner.startRun).toHaveBeenCalledWith(input);
  });

  it('workflow offers alone cannot satisfy knowledge-write requirements', () => {
    const adapter = new LangGraphWorkflowAdapter(createInnerRuntime());
    const plan = resolveRunPlan({
      engineId: 'knowledge.generate',
      offers: adapter.toCapabilityOffers('web'),
      requirements: knowledgeWriteRequirements('web'),
      surface: 'web',
    });
    expect(plan.engineId).toBe('none');
    expect(plan.missing.map((item) => item.kind).sort()).toEqual(
      ['context.cloud_rag', 'tool.mutation', 'tool.proposal'].sort(),
    );
  });

  it('engine.langgraph_workflow label never substitutes for tool.mutation', () => {
    const adapter = new LangGraphWorkflowAdapter(createInnerRuntime());
    const plan = resolveRunPlan({
      engineId: 'engine.langgraph_workflow',
      offers: [
        ...adapter.toCapabilityOffers('any'),
        {
          kind: 'tool.proposal',
          providerId: 'proposal',
          surface: 'any',
          readonly: false,
        },
        {
          kind: 'context.cloud_rag',
          providerId: 'rag',
          surface: 'web',
          readonly: true,
        },
      ],
      requirements: knowledgeWriteRequirements('web'),
      surface: 'web',
    });
    expect(plan.engineId).toBe('none');
    expect(plan.missing.map((item) => item.kind)).toEqual(['tool.mutation']);
  });
});
