import { defineComponent, h } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ok } from '@memoflow/contracts/result';
import type { AssistantEvent } from '@memoflow/contracts/ai';
import { useAIChatSession, type UseAIChatSessionOptions } from './useAIChatSession';
import type { ChatModelOption } from './types';

const toastMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('vue-sonner', () => ({
  toast: toastMocks,
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: { unknown: 'Unknown', operationFailed: 'Operation failed' },
      aiAssistant: {
        dialogs: {
          chat: {
            defaultConversationName: 'New chat',
            deleted: 'Deleted',
            loadFailed: 'Load failed',
            deleteFailed: 'Delete failed',
            sendFailed: 'Send failed',
          },
        },
      },
    },
  },
});

const MODEL: ChatModelOption = {
  key: 'provider-1::model-1',
  providerId: 'provider-1',
  providerName: 'Main provider',
  modelId: 'model-1',
  modelName: 'Model 1',
};

function createMessageEvent(overrides: Partial<AssistantEvent> = {}): AssistantEvent {
  return {
    type: 'message.completed',
    runId: 'server-run-1',
    status: 'completed',
    content: 'final content',
    userMessage: { id: 'user-1', content: 'hello' },
    assistantMessage: { id: 'assistant-1', content: 'final content' },
    ...overrides,
  } as AssistantEvent;
}

function createConversationDTO(id: string) {
  return {
    id,
    identityId: 'identity-1',
    name: 'New chat',
    createdAt: 1,
    updatedAt: 2,
    messageCount: 0,
    lastMessageAt: null,
  };
}

type ServiceStub = {
  createConversation: ReturnType<typeof vi.fn>;
  listConversations: ReturnType<typeof vi.fn>;
  dispatchAssistant: ReturnType<typeof vi.fn>;
  listMessages: ReturnType<typeof vi.fn>;
};

function createServiceStub(overrides: Partial<ServiceStub> = {}): ServiceStub {
  return {
    createConversation: vi.fn(async () => ok(createConversationDTO('conv-1'))),
    listConversations: vi.fn(async () =>
      ok({ data: [{ id: 'conv-1', name: 'New chat' }], total: 1, page: 1, pageSize: 24 }),
    ),
    dispatchAssistant: vi.fn(async () => {}),
    listMessages: vi.fn(async () => ok({ data: [], total: 0, page: 1, pageSize: 80 })),
    ...overrides,
  };
}

function mountComposable(service: ServiceStub, surface: 'web' | 'desktop' = 'web') {
  let composable!: ReturnType<typeof useAIChatSession>;
  const options: UseAIChatSessionOptions = {
    service,
    surface,
    getDefaultConversationName: () => 'New chat',
  };
  mount(
    defineComponent({
      setup() {
        composable = useAIChatSession(options);
        return () => h('div');
      },
    }),
    { global: { plugins: [i18n] } },
  );
  return composable;
}

function runDispatch(
  composable: ReturnType<typeof useAIChatSession>,
  service: ServiceStub,
  events: AssistantEvent[],
  dispatchImpl?: ServiceStub['dispatchAssistant'],
) {
  if (dispatchImpl) {
    service.dispatchAssistant.mockImplementation(dispatchImpl);
  } else {
    service.dispatchAssistant.mockImplementation(async (_command, handlers) => {
      for (const event of events) {
        handlers.onEvent?.(event);
      }
    });
  }
  composable.chatMessage.value = 'hello';
  return composable.handleSendChat(service as never, MODEL, 'New chat', () => {});
}

describe('useAIChatSession open chat Host dispatch (residual 349/351)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('creates a conversation then dispatches through the thin entry with model + surface', async () => {
    const service = createServiceStub();
    const composable = mountComposable(service, 'web');

    await runDispatch(composable, service, []);

    expect(service.createConversation).toHaveBeenCalledWith({ name: 'New chat' });
    expect(service.dispatchAssistant).toHaveBeenCalledTimes(1);
    const [command] = service.dispatchAssistant.mock.calls[0];
    expect(command).toMatchObject({
      type: 'message',
      conversationId: 'conv-1',
      content: 'hello',
      surface: 'web',
      executionProfileId: 'direct_turn',
      providerId: 'provider-1',
      model: 'model-1',
    });
    expect(command).toHaveProperty('runId');
    expect(command.runId).toMatch(/^open-chat:/);
    expect(command).not.toHaveProperty('identityId');
    expect(composable.chatLoading.value).toBe(false);
  });

  it('desktop host option flows the desktop surface on the command', async () => {
    const service = createServiceStub();
    const composable = mountComposable(service, 'desktop');

    await runDispatch(composable, service, []);

    expect(service.dispatchAssistant.mock.calls[0][0]).toMatchObject({
      type: 'message',
      surface: 'desktop',
    });
  });

  it('appends every message.delta to the current assistant draft', async () => {
    const service = createServiceStub();
    const composable = mountComposable(service, 'web');

    await runDispatch(composable, service, [
      {
        type: 'run.started',
        runId: 'server-run-1',
        engineId: 'engine.direct_turn',
        profile: 'direct_turn',
        conversationId: 'conv-1',
      },
      { type: 'message.delta', runId: 'server-run-1', content: 'Hel' },
      { type: 'message.delta', runId: 'server-run-1', content: 'lo' },
      createMessageEvent(),
    ]);

    const assistant = composable.chatTimeline.value.find(
      (item) => item.role === 'assistant' && item.id === 'assistant-1',
    );
    expect(assistant).toBeDefined();
    expect(assistant?.content).toBe('final content');
    expect(assistant?.status).toBe('success');

    const user = composable.chatTimeline.value.find((item) => item.role === 'user');
    expect(user?.id).toBe('user-1');
    expect(user?.content).toBe('hello');
  });

  it('message.completed replaces both drafts with persisted ids and refreshes the list', async () => {
    const service = createServiceStub();
    const composable = mountComposable(service, 'web');

    await runDispatch(composable, service, [createMessageEvent()]);

    expect(service.listConversations).toHaveBeenCalled();
    const ids = composable.chatTimeline.value.map((item) => item.id);
    expect(ids).toContain('assistant-1');
    expect(ids).toContain('user-1');
    expect(composable.chatTimeline.value.some((item) => item.status === 'generating')).toBe(false);
  });

  it('server-rewritten runId is tracked and the pre-start client row is dropped', async () => {
    const service = createServiceStub();
    const composable = mountComposable(service, 'web');

    await runDispatch(composable, service, [
      {
        type: 'run.started',
        runId: 'server-run-9',
        engineId: 'engine.direct_turn',
        profile: 'direct_turn',
      },
      createMessageEvent({ runId: 'server-run-9' }),
    ]);

    const turns = composable.openChatHostTurns.value;
    expect(turns.some((turn) => turn.runId === 'server-run-9')).toBe(true);
    expect(turns.some((turn) => turn.runId === 'server-run-1')).toBe(false);
  });

  it('marks the assistant draft aborted on abort-like errors with no generating residue', async () => {
    const service = createServiceStub();
    const composable = mountComposable(service, 'web');

    await runDispatch(
      composable,
      service,
      [],
      vi.fn(async () => {
        throw new DOMException('The user aborted a request.', 'AbortError');
      }),
    );

    const assistant = composable.chatTimeline.value.find((item) => item.role === 'assistant');
    expect(assistant?.status).toBe('aborted');
    expect(composable.chatLoading.value).toBe(false);
    expect(composable.chatTimeline.value.some((item) => item.status === 'generating')).toBe(false);
  });

  it('marks the assistant draft error and toasts on a failed dispatch', async () => {
    const service = createServiceStub();
    const composable = mountComposable(service, 'web');

    await runDispatch(
      composable,
      service,
      [],
      vi.fn(async () => {
        throw new Error('provider unavailable');
      }),
    );

    const assistant = composable.chatTimeline.value.find((item) => item.role === 'assistant');
    expect(assistant?.status).toBe('error');
    expect(assistant?.errorMessage).toBeDefined();
    expect(toastMocks.error).toHaveBeenCalled();
    expect(composable.chatLoading.value).toBe(false);
  });
});
