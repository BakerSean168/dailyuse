import { describe, expect, it, vi } from 'vitest';
import type {
  AssistantCommand,
  AssistantDispatchHandlers,
  AssistantEvent,
} from '@memoflow/contracts/ai';
import { ok } from '@memoflow/contracts/result';
import { AIAssistantFacadeController } from '../ai-assistant-facade.controller';

describe('AIAssistantFacadeController', () => {
  it('injects identityId from ExecutionContext and rejects body identityId', async () => {
    const dispatchAssistant = vi.fn(
      async (command: AssistantCommand, handlers: AssistantDispatchHandlers) => {
        handlers.onEvent?.({
          type: 'run.started',
          runId: 'run-1',
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
        });
        handlers.onEvent?.({
          type: 'message.completed',
          runId: 'run-1',
          status: 'completed',
          content: 'hi',
        });
        expect(command).toMatchObject({
          type: 'message',
          identityId: 'ctx-user',
          conversationId: 'conv-1',
          content: 'hello',
          surface: 'web',
        });
        return ok({ eventCount: 2 });
      },
    );

    const controller = new AIAssistantFacadeController({ dispatchAssistant });
    const events: AssistantEvent[] = [];
    const result = await controller.dispatch(
      {
        type: 'message',
        conversationId: 'conv-1',
        content: 'hello',
        surface: 'web',
        // Hostile body field — shared schema must REJECT it as validation failure.
        identityId: 'attacker',
      },
      { identityId: 'ctx-user' } as never,
      { onEvent: (event) => events.push(event) },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(dispatchAssistant).not.toHaveBeenCalled();
  });

  it('rejects invalid payload and missing identity', async () => {
    const dispatchAssistant = vi.fn();
    const controller = new AIAssistantFacadeController({ dispatchAssistant });

    const unauthorized = await controller.dispatch(
      { type: 'cancel_run', runId: 'r1' },
      { identityId: '' } as never,
      {},
    );
    expect(unauthorized.ok).toBe(false);
    if (!unauthorized.ok) {
      expect(unauthorized.error.code).toBe('UNAUTHORIZED');
    }

    const invalid = await controller.dispatch(
      { type: 'message', content: '' },
      { identityId: 'user-1' } as never,
      {},
    );
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error.code).toBe('VALIDATION_ERROR');
    }
    expect(dispatchAssistant).not.toHaveBeenCalled();
  });

  it('forwards the abort signal to the service', async () => {
    const abortController = new AbortController();
    const dispatchAssistant = vi.fn(
      async (
        _command: AssistantCommand,
        _handlers: AssistantDispatchHandlers,
        signal?: AbortSignal,
      ) => {
        expect(signal).toBe(abortController.signal);
        return ok({ eventCount: 0 });
      },
    );
    const controller = new AIAssistantFacadeController({ dispatchAssistant });

    const result = await controller.dispatch(
      { type: 'cancel_run', runId: 'run-1' },
      { identityId: 'user-1' } as never,
      {},
      abortController.signal,
    );

    expect(result.ok).toBe(true);
    expect(dispatchAssistant).toHaveBeenCalledTimes(1);
  });

  it('returns the named AssistantDispatchResult with eventCount', async () => {
    const dispatchAssistant = vi.fn(
      async (_command: AssistantCommand, handlers: AssistantDispatchHandlers) => {
        for (let i = 0; i < 3; i += 1) {
          handlers.onEvent?.({
            type: 'message.delta',
            runId: 'run-1',
            content: `chunk-${i}`,
          });
        }
        return ok({ eventCount: 3 });
      },
    );
    const controller = new AIAssistantFacadeController({ dispatchAssistant });
    const events: AssistantEvent[] = [];

    const result = await controller.dispatch(
      {
        type: 'message',
        conversationId: 'conv-1',
        content: 'hello',
        surface: 'web',
      },
      { identityId: 'user-1' } as never,
      { onEvent: (event) => events.push(event) },
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ eventCount: 3 });
    }
    expect(events.map((e) => e.type)).toEqual(['message.delta', 'message.delta', 'message.delta']);
  });

  it('routes approve_proposal without any mutation executor surface', async () => {
    const dispatchAssistant = vi.fn(
      async (command: AssistantCommand, handlers: AssistantDispatchHandlers) => {
        expect(command).toEqual({
          type: 'approve_proposal',
          identityId: 'user-1',
          runId: 'run-p',
          proposalId: 'prop-1',
          revision: 2,
        });
        handlers.onEvent?.({
          type: 'proposal.approved',
          runId: 'run-p',
          proposalId: 'prop-1',
          revision: 2,
        });
        return ok({ eventCount: 1 });
      },
    );
    const controller = new AIAssistantFacadeController({ dispatchAssistant });
    const events: AssistantEvent[] = [];
    const result = await controller.dispatch(
      {
        type: 'approve_proposal',
        runId: 'run-p',
        proposalId: 'prop-1',
        revision: 2,
      },
      { identityId: 'user-1' } as never,
      { onEvent: (event) => events.push(event) },
    );
    expect(result.ok).toBe(true);
    expect(events).toEqual([
      {
        type: 'proposal.approved',
        runId: 'run-p',
        proposalId: 'prop-1',
        revision: 2,
      },
    ]);
  });

  it('routes revise_proposal lifecycle without mutation executor surface', async () => {
    const dispatchAssistant = vi.fn(
      async (command: AssistantCommand, handlers: AssistantDispatchHandlers) => {
        expect(command).toMatchObject({
          type: 'revise_proposal',
          identityId: 'user-1',
          runId: 'run-p',
          proposalId: 'agent-run:run-p:goal.create',
          revision: 1,
          patch: { title: 'Edited' },
        });
        handlers.onEvent?.({
          type: 'proposal.revised',
          runId: 'run-p',
          proposalId: 'agent-run:run-p:goal.create',
          revision: 2,
          kind: 'goal.create',
          title: 'Edited',
        });
        return ok({ eventCount: 1 });
      },
    );
    const controller = new AIAssistantFacadeController({ dispatchAssistant });
    const events: AssistantEvent[] = [];
    const result = await controller.dispatch(
      {
        type: 'revise_proposal',
        runId: 'run-p',
        proposalId: 'agent-run:run-p:goal.create',
        revision: 1,
        patch: { title: 'Edited' },
      },
      { identityId: 'user-1' } as never,
      { onEvent: (event) => events.push(event) },
    );
    expect(result.ok).toBe(true);
    expect(events[0]).toMatchObject({ type: 'proposal.revised', revision: 2 });
  });

  it('routes reject_proposal lifecycle without mutation executor surface', async () => {
    const dispatchAssistant = vi.fn(
      async (command: AssistantCommand, handlers: AssistantDispatchHandlers) => {
        expect(command).toEqual({
          type: 'reject_proposal',
          identityId: 'user-1',
          runId: 'run-p',
          proposalId: 'prop-1',
          revision: 3,
          reason: 'needs revision',
        });
        handlers.onEvent?.({
          type: 'proposal.rejected',
          runId: 'run-p',
          proposalId: 'prop-1',
          revision: 3,
        });
        return ok({ eventCount: 1 });
      },
    );
    const controller = new AIAssistantFacadeController({ dispatchAssistant });
    const events: AssistantEvent[] = [];
    const result = await controller.dispatch(
      {
        type: 'reject_proposal',
        runId: 'run-p',
        proposalId: 'prop-1',
        revision: 3,
        reason: 'needs revision',
      },
      { identityId: 'user-1' } as never,
      { onEvent: (event) => events.push(event) },
    );
    expect(result.ok).toBe(true);
    expect(events[0]).toMatchObject({ type: 'proposal.rejected', revision: 3 });
  });

  it('routes cancel_run lifecycle', async () => {
    const dispatchAssistant = vi.fn(
      async (command: AssistantCommand, handlers: AssistantDispatchHandlers) => {
        expect(command).toEqual({
          type: 'cancel_run',
          identityId: 'user-1',
          runId: 'run-c',
        });
        handlers.onEvent?.({ type: 'run.cancelled', runId: 'run-c' });
        return ok({ eventCount: 1 });
      },
    );
    const controller = new AIAssistantFacadeController({ dispatchAssistant });
    const events: AssistantEvent[] = [];
    const result = await controller.dispatch(
      { type: 'cancel_run', runId: 'run-c' },
      { identityId: 'user-1' } as never,
      { onEvent: (event) => events.push(event) },
    );
    expect(result.ok).toBe(true);
    expect(events).toEqual([{ type: 'run.cancelled', runId: 'run-c' }]);
  });

  it('forwards executionProfileId pi_readonly with context identity only (residual 377)', async () => {
    const dispatchAssistant = vi.fn(
      async (command: AssistantCommand, handlers: AssistantDispatchHandlers) => {
        expect(command).toMatchObject({
          type: 'message',
          identityId: 'ctx-user',
          conversationId: 'conv-ro',
          content: 'analyze',
          surface: 'desktop',
          executionProfileId: 'pi_readonly',
        });
        expect(JSON.stringify(command)).not.toContain('attacker');
        handlers.onEvent?.({
          type: 'run.started',
          runId: 'run-ro',
          engineId: 'engine.pi_readonly',
          profile: 'pi_readonly',
        });
        handlers.onEvent?.({
          type: 'message.completed',
          runId: 'run-ro',
          status: 'completed',
        });
        return ok({ eventCount: 2 });
      },
    );
    const controller = new AIAssistantFacadeController({ dispatchAssistant });
    const events: AssistantEvent[] = [];
    const result = await controller.dispatch(
      {
        type: 'message',
        conversationId: 'conv-ro',
        content: 'analyze',
        surface: 'desktop',
        executionProfileId: 'pi_readonly',
      },
      { identityId: 'ctx-user' } as never,
      { onEvent: (event) => events.push(event) },
    );
    expect(result.ok).toBe(true);
    expect(events.map((e) => e.type)).toEqual(['run.started', 'message.completed']);
    expect(events[0]).toMatchObject({
      engineId: 'engine.pi_readonly',
      profile: 'pi_readonly',
    });
  });

  it('rejects unknown executionProfileId (residual 377)', async () => {
    const dispatchAssistant = vi.fn();
    const controller = new AIAssistantFacadeController({ dispatchAssistant });
    const result = await controller.dispatch(
      {
        type: 'message',
        conversationId: 'conv-1',
        content: 'hello',
        surface: 'web',
        executionProfileId: 'remote_agent',
      },
      { identityId: 'user-1' } as never,
      {},
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
    expect(dispatchAssistant).not.toHaveBeenCalled();
  });

  it('forwards the entry correlation requestId to the dispatch service', async () => {
    const dispatchAssistant = vi.fn(async () => ok({ eventCount: 0 }));
    const controller = new AIAssistantFacadeController({ dispatchAssistant });
    const cx = {
      requestId: 'entry-req-facade-1',
      traceId: 'entry-req-facade-1',
      startedAt: 1_700_000_000_000,
      source: 'http',
      identityId: 'user-1',
    } as never;
    await controller.dispatch({ type: 'cancel_run', runId: 'run-1' }, cx, {});
    expect(dispatchAssistant).toHaveBeenCalledOnce();
    const [, , , requestId] = dispatchAssistant.mock.calls[0];
    expect(requestId).toBe('entry-req-facade-1');
  });
});
