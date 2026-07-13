import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import AIMessagePanel from './AIMessagePanel.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      aiAssistant: {
        dialogs: {
          chat: {
            you: 'You',
            assistant: 'Assistant',
          },
        },
        chatPage: {
          welcomeTitle: 'What do you want to move forward today?',
          welcomeDescription: 'Pick a shortcut card.',
          emptyTitle: 'Start',
          emptyDescription: 'Describe',
          context: { todayOverview: 'Today' },
          toolIntro: {
            goalCreate: { title: 'Goal mode', description: 'Goal desc' },
            knowledgeQa: { title: 'QA mode', description: 'QA desc' },
            knowledgeGenerate: { title: 'Note mode', description: 'Note desc' },
          },
          shortcuts: {
            chat: { title: 'Just chat', description: 'Chat desc', prefill: 'chat prefill' },
            goalCreate: { title: 'Plan a goal', description: 'Goal shortcut', prefill: 'goal prefill' },
            knowledgeGenerate: {
              title: 'Write a note',
              description: 'Note shortcut',
              prefill: 'note prefill',
            },
            knowledgeQa: { title: 'Ask KB', description: 'QA shortcut', prefill: 'qa prefill' },
          },
        },
      },
    },
  },
});

describe('AIMessagePanel (V2 §6.0 welcome)', () => {
  it('renders four shortcut cards and today overview when idle in chat mode', () => {
    const wrapper = mount(AIMessagePanel, {
      props: {
        timeline: [],
        toolMode: 'chat',
        showTodayOverview: true,
      },
      slots: {
        'today-overview': '<div data-testid="today-slot">today widgets</div>',
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.find('[data-testid="ai-welcome-state"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('What do you want to move forward today?');
    expect(wrapper.find('[data-testid="ai-welcome-entry-chat"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="ai-welcome-entry-goal-create"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="ai-welcome-entry-knowledge-generate"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="ai-welcome-entry-knowledge-qa"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="ai-today-overview"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="today-slot"]').exists()).toBe(true);
  });

  it('hides today overview once messages exist and emits select-shortcut', async () => {
    const wrapper = mount(AIMessagePanel, {
      props: {
        timeline: [{ id: 'm1', role: 'user', content: 'hello' }],
        toolMode: 'chat',
        showTodayOverview: true,
        showWorkflowSurface: false,
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.find('[data-testid="ai-welcome-state"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="ai-today-overview"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('hello');
  });

  it('emits select-shortcut from welcome cards', async () => {
    const wrapper = mount(AIMessagePanel, {
      props: {
        timeline: [],
        toolMode: 'chat',
      },
      global: { plugins: [i18n] },
    });

    await wrapper.get('[data-testid="ai-welcome-entry-goal-create"]').trigger('click');
    expect(wrapper.emitted('select-shortcut')?.[0]).toEqual(['goal-create']);
  });

  it('shows workflow surface slot when requested', () => {
    const wrapper = mount(AIMessagePanel, {
      props: {
        timeline: [{ id: 'm1', role: 'user', content: 'plan a goal' }],
        toolMode: 'goal-create',
        showWorkflowSurface: true,
      },
      slots: {
        'workflow-surface': '<div data-testid="wf-slot">status</div>',
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.find('[data-testid="ai-workflow-message-surface"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="wf-slot"]').exists()).toBe(true);
  });
});
