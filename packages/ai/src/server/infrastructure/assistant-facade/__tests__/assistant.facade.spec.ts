import { describe, expect, it, vi } from 'vitest';
import type {
  AgentProposal,
  IProposalKernelPort,
  ITurnEnginePort,
} from '@dailyuse/contracts/ai';
import type { IOpenChatTurnPort } from '../../../application/ports';
import { AssistantFacade } from '../assistant.facade';

function proposal(overrides: Partial<AgentProposal> = {}): AgentProposal {
  return {
    kind: 'knowledge.write',
    id: 'prop-1',
    status: 'ready',
    revision: 1,
    targetPath: 'notes/a.md',
    contentMarkdown: 'body',
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  } as AgentProposal;
}

function createOpenChat(
  overrides: Partial<IOpenChatTurnPort> = {},
): IOpenChatTurnPort {
  return {
    engineId: 'engine.direct_turn',
    executeConversationTurn: vi.fn().mockResolvedValue({
      status: 'completed',
      content: 'hello',
    }),
    streamConversationTurn: vi.fn().mockImplementation(async (_input, onChunk) => {
      onChunk({ content: 'hel' });
      onChunk({ content: 'lo' });
      return { status: 'completed', content: 'hello' };
    }),
    abort: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createReadonlyEngine(
  overrides: Partial<ITurnEnginePort> = {},
): ITurnEnginePort {
  return {
    engineId: 'engine.pi_readonly',
    abort: vi.fn().mockResolvedValue(undefined),
    startTurn: vi.fn().mockResolvedValue({ status: 'completed' }),
    ...overrides,
  };
}

function createKernel(
  overrides: Partial<IProposalKernelPort> = {},
): IProposalKernelPort {
  return {
    create: vi.fn(),
    revise: vi.fn(),
    markStale: vi.fn(),
    approve: vi.fn().mockResolvedValue(proposal({ status: 'approved', revision: 1 })),
    reject: vi.fn().mockResolvedValue(proposal({ status: 'rejected', revision: 1 })),
    executeApproved: vi.fn().mockRejectedValue(new Error('must not be called by facade')),
    ...overrides,
  };
}

async function collect(
  facade: AssistantFacade,
  command: Parameters<AssistantFacade['dispatch']>[0],
) {
  const events = [];
  for await (const event of facade.dispatch(command)) {
    events.push(event);
  }
  return events;
}

describe('AssistantFacade', () => {
  it('streams open chat via DirectTurnEngine profile by default', async () => {
    const openChat = createOpenChat();
    const readonlyEngine = createReadonlyEngine();
    const primary = createReadonlyEngine({ engineId: 'engine.direct_turn' });
    const kernel = createKernel();
    const facade = new AssistantFacade(openChat, readonlyEngine, kernel, primary);

    const events = await collect(facade, {
      type: 'message',
      identityId: 'user-1',
      conversationId: 'conv-1',
      content: 'hi',
      surface: 'web',
      runId: 'run-1',
      providerId: 'prov-1',
      model: 'gpt-test',
    });

    expect(events[0]).toMatchObject({
      type: 'run.started',
      runId: 'run-1',
      engineId: 'engine.direct_turn',
      profile: 'direct_turn',
    });
    expect(events).toContainEqual({ type: 'message.delta', runId: 'run-1', content: 'hel' });
    expect(events).toContainEqual({ type: 'message.delta', runId: 'run-1', content: 'lo' });
    expect(events.at(-1)).toMatchObject({
      type: 'message.completed',
      runId: 'run-1',
      status: 'completed',
      content: 'hello',
    });
    expect(openChat.streamConversationTurn).toHaveBeenCalledOnce();
    expect(openChat.streamConversationTurn).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: 'prov-1',
        model: 'gpt-test',
        conversationId: 'conv-1',
      }),
      expect.any(Function),
    );
    expect(readonlyEngine.startTurn).not.toHaveBeenCalled();
    expect(kernel.executeApproved).not.toHaveBeenCalled();
  });

  it('routes pi_readonly profile to ReadonlyAnalysisTurnEngine', async () => {
    const openChat = createOpenChat();
    const readonlyEngine = createReadonlyEngine();
    const primary = createReadonlyEngine({ engineId: 'engine.direct_turn' });
    const facade = new AssistantFacade(
      openChat,
      readonlyEngine,
      createKernel(),
      primary,
    );

    const events = await collect(facade, {
      type: 'message',
      identityId: 'user-1',
      conversationId: 'conv-1',
      content: 'analyze',
      surface: 'desktop',
      executionProfileId: 'pi_readonly',
      runId: 'run-ro',
    });

    expect(events[0]).toMatchObject({
      type: 'run.started',
      engineId: 'engine.pi_readonly',
      profile: 'pi_readonly',
    });
    expect(readonlyEngine.startTurn).toHaveBeenCalledOnce();
    expect(openChat.streamConversationTurn).not.toHaveBeenCalled();
  });

  it('approves proposals without executing mutations', async () => {
    const kernel = createKernel();
    const facade = new AssistantFacade(
      createOpenChat(),
      createReadonlyEngine(),
      kernel,
      createReadonlyEngine(),
    );

    const events = await collect(facade, {
      type: 'approve_proposal',
      identityId: 'user-1',
      runId: 'run-p',
      proposalId: 'prop-1',
      revision: 1,
    });

    expect(events).toEqual([
      {
        type: 'proposal.approved',
        runId: 'run-p',
        proposalId: 'prop-1',
        revision: 1,
      },
    ]);
    expect(kernel.approve).toHaveBeenCalledWith('prop-1', 1);
    expect(kernel.executeApproved).not.toHaveBeenCalled();
  });

  it('rejects proposals and cancels runs on both engines', async () => {
    const openChat = createOpenChat();
    const readonlyEngine = createReadonlyEngine();
    const primary = createReadonlyEngine({ engineId: 'engine.direct_turn' });
    const kernel = createKernel();
    const facade = new AssistantFacade(openChat, readonlyEngine, kernel, primary);

    const rejected = await collect(facade, {
      type: 'reject_proposal',
      identityId: 'user-1',
      runId: 'run-r',
      proposalId: 'prop-1',
      revision: 1,
      reason: 'nope',
    });
    expect(rejected[0]).toMatchObject({ type: 'proposal.rejected', reason: 'nope' });

    const cancelled = await collect(facade, {
      type: 'cancel_run',
      identityId: 'user-1',
      runId: 'run-c',
    });
    expect(cancelled).toEqual([{ type: 'run.cancelled', runId: 'run-c' }]);
    expect(primary.abort).toHaveBeenCalledWith('run-c');
    expect(readonlyEngine.abort).toHaveBeenCalledWith('run-c');
    expect(openChat.abort).toHaveBeenCalledWith('run-c');
  });
});
