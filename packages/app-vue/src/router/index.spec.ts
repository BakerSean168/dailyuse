import { createMemoryHistory } from 'vue-router';
import { describe, expect, it } from 'vitest';
import { createAppRouter } from './index';

describe('createAppRouter', () => {
  it('mounts the AI Agent Workspace at the root route', () => {
    const router = createAppRouter({
      history: createMemoryHistory(),
      isAuthenticated: () => true,
    });

    const route = router.resolve('/');

    expect(route.name).toBe('ai-workspace');
    expect(route.meta.title).toBe('aiAssistant.chatPage.title');
  });

  it('keeps /ai/chat as an AI workspace entry route', () => {
    const router = createAppRouter({
      history: createMemoryHistory(),
      isAuthenticated: () => true,
    });

    expect(router.resolve('/ai/chat').name).toBe('ai-chat');
  });
});
