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

  it('redirects the legacy /ai/chat entry to the AI workspace root', async () => {
    const router = createAppRouter({
      history: createMemoryHistory(),
      isAuthenticated: () => true,
    });

    await router.push('/ai/chat');

    expect(router.currentRoute.value.name).toBe('ai-workspace');
    expect(router.currentRoute.value.path).toBe('/');
  });
});
