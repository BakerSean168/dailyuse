import { describe, expect, it, vi } from 'vitest';
import { AIAssistantIpcAdapter } from './ai-assistant-ipc.adapter';

describe('AIAssistantIpcAdapter', () => {
  it('fail-closes with NOT_SUPPORTED until desktop stream channels exist', async () => {
    const adapter = new AIAssistantIpcAdapter({ invoke: vi.fn() } as never);
    await expect(
      adapter.dispatchAssistant(
        {
          type: 'message',
          conversationId: 'c1',
          content: 'hi',
          surface: 'desktop',
        },
        {},
      ),
    ).rejects.toMatchObject({ code: 'NOT_SUPPORTED' });
  });
});
