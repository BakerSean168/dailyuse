import { describe, expect, it } from 'vitest';
import {
  buildHostOpenChatStopCancelCommand,
  createHostOpenChatRunId,
  isHostOpenChatCancelledEvent,
} from './hostOpenChatCancel';

describe('hostOpenChatCancel (residual 393)', () => {
  it('createHostOpenChatRunId returns stable open-chat prefix without secrets', () => {
    const id = createHostOpenChatRunId(() => 1_700_000_000_000, () => 0.42);
    expect(id.startsWith('open-chat:')).toBe(true);
    expect(id).not.toMatch(/identity|token|secret/i);
    expect(id.length).toBeGreaterThan('open-chat:'.length);
  });

  it('buildHostOpenChatStopCancelCommand builds cancel_run without identityId', () => {
    expect(buildHostOpenChatStopCancelCommand('run-abc')).toEqual({
      type: 'cancel_run',
      runId: 'run-abc',
    });
    expect(buildHostOpenChatStopCancelCommand('  run-trim  ')).toEqual({
      type: 'cancel_run',
      runId: 'run-trim',
    });
    expect(buildHostOpenChatStopCancelCommand(null)).toBeNull();
    expect(buildHostOpenChatStopCancelCommand(undefined)).toBeNull();
    expect(buildHostOpenChatStopCancelCommand('')).toBeNull();
    expect(buildHostOpenChatStopCancelCommand('   ')).toBeNull();

    const command = buildHostOpenChatStopCancelCommand('run-1')!;
    expect(command).not.toHaveProperty('identityId');
  });

  it('isHostOpenChatCancelledEvent detects cancel and aborted completion', () => {
    expect(isHostOpenChatCancelledEvent({ type: 'run.cancelled' })).toBe(true);
    expect(
      isHostOpenChatCancelledEvent({ type: 'message.completed', status: 'aborted' }),
    ).toBe(true);
    expect(
      isHostOpenChatCancelledEvent({ type: 'message.completed', status: 'completed' }),
    ).toBe(false);
    expect(isHostOpenChatCancelledEvent({ type: 'message.delta' })).toBe(false);
  });
});
