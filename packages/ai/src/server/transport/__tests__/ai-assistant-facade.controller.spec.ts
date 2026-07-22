import { describe, expect, it, vi } from 'vitest';
import type { AssistantCommand, AssistantEvent } from '@dailyuse/contracts/ai';
import { ok } from '@dailyuse/contracts/result';
import { AIAssistantFacadeController } from '../ai-assistant-facade.controller';

describe('AIAssistantFacadeController', () => {
  it('injects identityId from ExecutionContext and never trusts body identityId', async () => {
    const dispatchAssistant = vi.fn(
      async (
        command: AssistantCommand,
        onEvent: (event: AssistantEvent) => void,
      ) => {
        onEvent({
          type: 'run.started',
          runId: 'run-1',
          engineId: 'engine.direct_turn',
          profile: 'direct_turn',
        });
        onEvent({
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
        // Hostile body field — must be ignored if somehow present after schema strip
        identityId: 'attacker',
      },
      { identityId: 'ctx-user' } as never,
      (event) => events.push(event),
    );

    expect(result.ok).toBe(true);
    expect(dispatchAssistant).toHaveBeenCalledOnce();
    const command = dispatchAssistant.mock.calls[0][0] as AssistantCommand;
    expect(command).toMatchObject({ identityId: 'ctx-user' });
    expect(command).not.toMatchObject({ identityId: 'attacker' });
    expect(events.map((e) => e.type)).toEqual(['run.started', 'message.completed']);
  });

  it('rejects invalid payload and missing identity', async () => {
    const dispatchAssistant = vi.fn();
    const controller = new AIAssistantFacadeController({ dispatchAssistant });

    const unauthorized = await controller.dispatch(
      { type: 'cancel_run', runId: 'r1' },
      { identityId: '' } as never,
      () => undefined,
    );
    expect(unauthorized.ok).toBe(false);
    if (!unauthorized.ok) {
      expect(unauthorized.error.code).toBe('UNAUTHORIZED');
    }

    const invalid = await controller.dispatch(
      { type: 'message', content: '' },
      { identityId: 'user-1' } as never,
      () => undefined,
    );
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.error.code).toBe('VALIDATION_ERROR');
    }
    expect(dispatchAssistant).not.toHaveBeenCalled();
  });

  it('routes approve_proposal without any mutation executor surface', async () => {
    const dispatchAssistant = vi.fn(async (command: AssistantCommand, onEvent) => {
      expect(command).toEqual({
        type: 'approve_proposal',
        identityId: 'user-1',
        runId: 'run-p',
        proposalId: 'prop-1',
        revision: 2,
      });
      onEvent({
        type: 'proposal.approved',
        runId: 'run-p',
        proposalId: 'prop-1',
        revision: 2,
      });
      return ok({ eventCount: 1 });
    });
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
      (event) => events.push(event),
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
    const dispatchAssistant = vi.fn(async (command, onEvent) => {
      expect(command).toMatchObject({
        type: 'revise_proposal',
        identityId: 'user-1',
        runId: 'run-p',
        proposalId: 'agent-run:run-p:goal.create',
        revision: 1,
        patch: { title: 'Edited' },
      });
      onEvent({
        type: 'proposal.revised',
        runId: 'run-p',
        proposalId: 'agent-run:run-p:goal.create',
        revision: 2,
        kind: 'goal.create',
        title: 'Edited',
      });
      return ok({ eventCount: 1 });
    });
    const controller = new AIAssistantFacadeController({ dispatchAssistant });
    const events = [];
    const result = await controller.dispatch(
      {
        type: 'revise_proposal',
        runId: 'run-p',
        proposalId: 'agent-run:run-p:goal.create',
        revision: 1,
        patch: { title: 'Edited' },
      },
      { identityId: 'user-1' } as never,
      (event) => events.push(event),
    );
    expect(result.ok).toBe(true);
    expect(events[0]).toMatchObject({ type: 'proposal.revised', revision: 2 });
  });

});