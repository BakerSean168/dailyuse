import { shallowMount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { defineComponent, h, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import { productionLocaleMessages } from '../../../locales/production-messages';
import GoalListView from './GoalListView.vue';

vi.mock('../composables/useGoal', () => ({
  useGoal: () => ({
    goals: ref([]),
    isLoading: ref(false),
    selectedFolderId: ref(null),
    systemView: ref('active'),
    deleteGoal: vi.fn(),
  }),
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: productionLocaleMessages,
});

const EmptyStateStub = defineComponent({
  name: 'AppEmptyState',
  setup(_, { slots }) {
    return () => h('div', { 'data-testid': 'goals-empty-state' }, slots.action?.());
  },
});

describe('GoalListView', () => {
  it('leaves title, search, and the primary create action to the page toolbar', () => {
    const wrapper = shallowMount(GoalListView, {
      global: {
        plugins: [i18n],
        stubs: {
          AppEmptyState: EmptyStateStub,
          ScrollArea: defineComponent({
            setup(_, { slots }) {
              return () => h('div', slots.default?.());
            },
          }),
        },
        mocks: {
          $router: { push: vi.fn() },
        },
      },
    });

    expect(wrapper.find('[data-testid="goals-empty-state"]').exists()).toBe(true);
    expect(wrapper.findAll('[data-primary-action="create-goal"]')).toHaveLength(0);
    expect(wrapper.find('[data-testid="goal-list-create-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="create-goal-button"]').exists()).toBe(false);
    expect(wrapper.find('header').exists()).toBe(false);
  });
});
