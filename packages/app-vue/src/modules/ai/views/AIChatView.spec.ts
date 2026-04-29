import { defineComponent, h, ref } from 'vue';
import { flushPromises, shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  useAI: vi.fn(),
  useGoal: vi.fn(),
  useRepository: vi.fn(),
  useUserSetting: vi.fn(),
  useEditorWorkspaceActions: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock('vue-sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock('../composables/useAI', () => ({
  useAI: mocks.useAI,
}));

vi.mock('../../goal/composables/useGoal', () => ({
  useGoal: mocks.useGoal,
}));

vi.mock('../../repository/composables/useRepository', () => ({
  useRepository: mocks.useRepository,
}));

vi.mock('../../setting/composables/useUserSetting', () => ({
  useUserSetting: mocks.useUserSetting,
}));

vi.mock('../../editor/composables', () => ({
  useEditorWorkspaceActions: mocks.useEditorWorkspaceActions,
}));

import AIChatView from './AIChatView.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      nav: {
        aiChat: 'AI Chat',
        settings: 'Settings',
      },
      common: {
        unknown: 'Unknown',
        untitled: 'Untitled',
        operationFailed: 'Operation failed',
      },
      aiAssistant: {
        dialogs: {
          chat: {
            newConversation: 'New conversation',
            refresh: 'Refresh',
            noSavedConversations: 'No conversations',
            you: 'You',
            assistant: 'Assistant',
            defaultConversationName: 'New chat',
            sendMessage: 'Send',
            messagePlaceholder: 'Type a message',
            deleted: 'Deleted',
            loadFailed: 'Load failed',
            deleteFailed: 'Delete failed',
            aborted: 'Aborted',
            sendFailed: 'Send failed',
          },
          generateGoal: {
            generating: 'Generating draft',
            draftGenerated: 'Draft generated',
            generateFailed: 'Generate failed',
            created: 'Created',
            createFailed: 'Create failed',
          },
          note: {
            creating: 'Creating note',
            created: 'Created note',
            createFailed: 'Create note failed',
            previewUnavailable: 'Preview unavailable',
          },
        },
        goalDraft: {
          creatingGoal: 'Creating goal',
        },
        chatPage: {
          emptyTitle: 'Start a conversation',
          emptyDescription: 'Describe what you want to do.',
          emptyModels: 'No models available',
          toolIntro: {
            goal: {
              title: 'Goal mode',
              description: 'Turn the conversation into a goal draft.',
            },
            knowledgeNote: {
              title: 'Note mode',
              description: 'Turn the conversation into a note.',
            },
          },
          workflow: {
            activeMode: 'Active mode',
            toolButton: 'Tools',
            goalDraftTitle: 'Goal draft',
            goalCollectingHint: 'Collecting details for the goal',
            goalDraftReadyHint: 'Draft ready',
            noteCreatedHint: 'Note created: {path}',
            noteCollectingHint: 'Collecting note context',
            generateGoalDraft: 'Generate goal draft',
            regenerateGoalDraft: 'Regenerate draft',
            createGoalDirectly: 'Create goal directly',
            editGoalBeforeCreate: 'Edit goal before create',
            hideGoalEditor: 'Hide goal editor',
            exitTool: 'Exit tool',
            openCreatedNote: 'Open note',
            startAnotherNote: 'Start another note',
            defaultConversationNames: {
              goal: 'Goal conversation',
              knowledgeNote: 'Knowledge note conversation',
            },
            tools: {
              chat: 'Chat',
              goal: 'Goal',
              knowledgeNote: 'Knowledge note',
            },
            noteTopicFallback: 'New note topic',
          },
        },
        actions: {
          automateGoalSetup: 'Automate goal setup',
          expandDraft: 'Expand draft',
          askKnowledge: 'Ask knowledge',
          askAnalytics: 'Ask analytics',
          viewQualityReports: 'View quality reports',
        },
      },
    },
  },
});

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: ['disabled', 'variant', 'size', 'title'],
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          disabled: props.disabled,
          title: props.title,
        },
        slots.default?.(),
      );
  },
});

const SelectItemStub = defineComponent({
  name: 'SelectItemStub',
  props: ['value'],
  setup(props, { slots }) {
    return () => h('option', { value: props.value }, slots.default?.());
  },
});

const DivStub = defineComponent({
  name: 'DivStub',
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.());
  },
});

function createGoalDraft(title: string, description: string) {
  return {
    goal: {
      title,
      description,
      category: 'learning',
      importance: 'Important',
      tags: ['ai'],
      suggestedStartDate: 1,
      suggestedEndDate: 2,
    },
    keyResults: [],
  };
}

function mountView() {
  return shallowMount(AIChatView, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        DropdownMenu: DivStub,
        DropdownMenuContent: DivStub,
        DropdownMenuItem: ButtonStub,
        DropdownMenuSeparator: DivStub,
        DropdownMenuTrigger: DivStub,
        Select: DivStub,
        SelectContent: DivStub,
        SelectGroup: DivStub,
        SelectItem: SelectItemStub,
        SelectLabel: DivStub,
        SelectTrigger: DivStub,
        SelectValue: DivStub,
        AIGoalDraftEditor: DivStub,
      },
    },
  });
}

describe('AIChatView', () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.push.mockReset();
    mocks.toastSuccess.mockReset();
    mocks.toastError.mockReset();
    mocks.useAI.mockReset();
    mocks.useGoal.mockReset();
    mocks.useRepository.mockReset();
    mocks.useUserSetting.mockReset();
    mocks.useEditorWorkspaceActions.mockReset();

    const providers = ref<unknown[]>([]);
    const resources = ref([]);
    const aiService = {
      listConversations: vi.fn(),
      listMessages: vi.fn(),
      createConversation: vi.fn(),
      updateConversation: vi.fn(),
      deleteConversation: vi.fn(),
      generateGoal: vi.fn(),
      createKnowledgeNote: vi.fn(),
      streamMessage: vi.fn(),
    };
    const loadProviders = vi.fn(async () => {
      providers.value = [
        {
          id: 'provider-1',
          name: 'Main provider',
          defaultModel: 'gpt-4o-mini',
          availableModels: [{ id: 'gpt-4o-mini', name: 'gpt-4o-mini' }],
          isDefault: true,
        },
      ];
      return providers.value;
    });
    const createGoal = vi.fn();
    const addKeyResult = vi.fn();
    const initRepository = vi.fn(async () => {});
    const fetchResources = vi.fn(async () => {});
    const requestOpenResource = vi.fn();

    mocks.useAI.mockReturnValue({
      service: aiService,
      providers,
      loadProviders,
    });
    mocks.useGoal.mockReturnValue({
      createGoal,
      addKeyResult,
    });
    mocks.useRepository.mockReturnValue({
      initRepository,
      fetchResources,
      resources,
    });
    mocks.useUserSetting.mockReturnValue({
      getCategory: () => ({ knowledgeNoteSubpath: 'notes/ai' }),
    });
    mocks.useEditorWorkspaceActions.mockReturnValue({
      requestOpenResource,
    });

    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      lineHeight: '20',
      paddingTop: '0',
      paddingBottom: '0',
      borderTopWidth: '0',
      borderBottomWidth: '0',
    } as CSSStyleDeclaration);
    vi.spyOn(HTMLElement.prototype, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('restores persisted goal workflow state when reopening the last active conversation', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal',
          goalDraft: createGoalDraft('Restored AI Goal', 'Recovered draft from storage'),
          editableGoal: {
            name: 'Restored AI Goal',
            description: 'Recovered draft from storage',
            category: 'learning',
            importance: 'Important',
            motivation: '',
            feasibilityAnalysis: '',
            tags: ['ai'],
            startDate: 1,
            targetDate: 2,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service, loadProviders } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue({
      data: [{ id: 'conv-1', name: 'Goal session' }],
    });
    service.listMessages.mockResolvedValue({
      data: [{ id: 'm-1', role: 'user', content: 'Help me design an AI goal.' }],
    });

    const wrapper = mountView();
    await flushPromises();

    expect(loadProviders).toHaveBeenCalledTimes(1);
    expect(service.listMessages).toHaveBeenCalledWith('conv-1', { page: 1, pageSize: 80 });
    expect(wrapper.text()).toContain('Restored AI Goal');
    expect(wrapper.text()).toContain('Recovered draft from storage');
  });

  it('generates a goal draft from the restored conversation transcript', async () => {
    localStorage.setItem('ai:last-conversation-id', 'conv-1');
    localStorage.setItem(
      'ai:conversation-workflow-map',
      JSON.stringify({
        'conv-1': {
          mode: 'goal',
          goalDraft: null,
          editableGoal: {
            name: '',
            description: '',
            category: '',
            importance: 'Moderate',
            motivation: '',
            feasibilityAnalysis: '',
            tags: [],
            startDate: null,
            targetDate: null,
          },
          editableKeyResults: [],
          noteSummary: null,
          showGoalDraftEditor: false,
        },
      }),
    );
    const { service } = mocks.useAI.mock.results[0]?.value ?? mocks.useAI();
    service.listConversations.mockResolvedValue({
      data: [{ id: 'conv-1', name: 'Goal session' }],
    });
    service.listMessages.mockResolvedValue({
      data: [{ id: 'm-1', role: 'user', content: 'Help me design an AI goal.' }],
    });
    service.generateGoal.mockResolvedValue(
      createGoalDraft('Generated AI Goal', 'Generated from the current conversation'),
    );

    const wrapper = mountView();
    await flushPromises();

    const generateButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Generate goal draft'));
    expect(generateButton).toBeDefined();

    await generateButton!.trigger('click');
    await flushPromises();

    expect(service.generateGoal).toHaveBeenCalledWith({
      idea: 'User: Help me design an AI goal.',
      includeKeyResults: true,
      providerId: 'provider-1',
      model: 'gpt-4o-mini',
    });
    expect(wrapper.text()).toContain('Generated AI Goal');
    expect(wrapper.text()).toContain('Generated from the current conversation');
  });
});
