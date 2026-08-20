import { describe, expect, it } from 'vitest';
import { AIChannels, AIStreamChannels } from './ipc-channels';

/**
 * AI IPC surface (stage-6 residual):
 * Request/response handlers live on AIChannels; stream push events on AIStreamChannels.
 */
describe('AIChannels / AIStreamChannels surface', () => {
  it('keeps stream push events off AIChannels request surface', () => {
    for (const key of [
      'MESSAGE_STREAM_CHUNK',
      'MESSAGE_STREAM_DONE',
      'MESSAGE_STREAM_ERROR',
      'RUNTIME_ASSISTANT_EVENT',
      'RUNTIME_ASSISTANT_ERROR',
      'ASSISTANT_DISPATCH_EVENT',
      'ASSISTANT_DISPATCH_DONE',
      'ASSISTANT_DISPATCH_ERROR',
    ] as const) {
      expect(AIChannels).not.toHaveProperty(key);
    }
    expect(Object.values(AIChannels)).not.toContain('ai:chat:message:stream:chunk');
    expect(Object.values(AIChannels)).not.toContain('ai:assistant:dispatch:event');
  });

  it('keeps stream start/cancel on AIChannels and chunk/done/error on AIStreamChannels', () => {
    expect(AIChannels.MESSAGE_STREAM_START).toBe('ai:chat:message:stream:start');
    expect(AIChannels.MESSAGE_STREAM_CANCEL).toBe('ai:chat:message:stream:cancel');
    expect(AIStreamChannels.MESSAGE_STREAM_CHUNK).toBe('ai:chat:message:stream:chunk');
    expect(AIStreamChannels.MESSAGE_STREAM_DONE).toBe('ai:chat:message:stream:done');
    expect(AIStreamChannels.MESSAGE_STREAM_ERROR).toBe('ai:chat:message:stream:error');
    expect(AIChannels.RUNTIME_ASSISTANT_START).toBe('ai:runtime:assistant:start');
    expect(AIChannels.RUNTIME_ASSISTANT_CANCEL).toBe('ai:runtime:assistant:cancel');
    expect(AIChannels.RUNTIME_WORKFLOW_START).toBe('ai:runtime:workflow:start');
    expect(AIChannels.RUNTIME_WORKFLOW_RESUME).toBe('ai:runtime:workflow:resume');
    expect(AIChannels.RUNTIME_WORKFLOW_GET).toBe('ai:runtime:workflow:get');
    expect(AIChannels.RUNTIME_WORKFLOW_LIST).toBe('ai:runtime:workflow:list');
    expect(AIChannels.RUNTIME_WORKFLOW_CANCEL).toBe('ai:runtime:workflow:cancel');
    expect(AIStreamChannels.RUNTIME_ASSISTANT_EVENT).toBe('ai:runtime:assistant:event');
    expect(AIStreamChannels.RUNTIME_ASSISTANT_ERROR).toBe('ai:runtime:assistant:error');
    expect(AIChannels.ASSISTANT_DISPATCH_START).toBe('ai:assistant:dispatch:start');
    expect(AIChannels.ASSISTANT_DISPATCH_CANCEL).toBe('ai:assistant:dispatch:cancel');
    expect(AIStreamChannels.ASSISTANT_DISPATCH_EVENT).toBe('ai:assistant:dispatch:event');
    expect(AIStreamChannels.ASSISTANT_DISPATCH_DONE).toBe('ai:assistant:dispatch:done');
    expect(AIStreamChannels.ASSISTANT_DISPATCH_ERROR).toBe('ai:assistant:dispatch:error');
  });
});
