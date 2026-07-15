/** @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import type { GoalFolderClientDTO, GoalSystemView } from '@dailyuse/contracts/goal';
import GoalPageToolbar from './GoalPageToolbar.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: { more: 'More' },
      goal: {
        systemFolders: { active: 'Active' },
        focusMode: { sidebarTitle: 'Focus Cycle' },
        list: {
          searchGoals: 'Search goals',
          newGoal: 'New Goal',
          newFolder: 'New Folder',
          compare: 'Compare',
        },
      },
    },
  },
});

const systemViews = [
  { id: 'active' as GoalSystemView, label: 'Active', count: 2 },
  { id: 'completed' as GoalSystemView, label: 'Completed', count: 1 },
];

const folders = [
  {
    id: 'GoalFolderId_work',
    identityId: 'IdentityId_owner',
    name: 'Work',
    color: '#3366ff',
    icon: null,
    parentId: null,
    order: 0,
    createdAt: 0,
    updatedAt: 0,
  } as unknown as GoalFolderClientDTO,
];

function mountToolbar() {
  return mount(GoalPageToolbar, {
    attachTo: document.body,
    props: {
      systemViews,
      activeSystemView: 'active',
      folders,
      selectedFolderId: null,
      focusMode: null,
      visibleGoalCount: 2,
      searchQuery: '',
    },
    global: { plugins: [i18n] },
  });
}

describe('GoalPageToolbar', () => {
  it('owns the only primary create action and keeps secondary actions distinct', async () => {
    const wrapper = mountToolbar();

    expect(wrapper.findAll('[data-testid="goal-page-toolbar"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-primary-action="create-goal"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="create-goal-entry"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="goal-focus-entry"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="goal-toolbar-more"]')).toHaveLength(1);

    await wrapper.get('[data-testid="create-goal-entry"]').trigger('click');
    await wrapper.get('[data-testid="goal-focus-entry"]').trigger('click');

    expect(wrapper.emitted('create-goal')).toHaveLength(1);
    expect(wrapper.emitted('open-focus')).toHaveLength(1);
    wrapper.unmount();
  });

  it('keeps one search control and preserves its DOM, value, and focus across layout changes', async () => {
    const wrapper = mountToolbar();
    const searchInput = wrapper.get('[data-testid="goal-search-input"]');

    await searchInput.setValue('quarterly roadmap');
    (searchInput.element as HTMLInputElement).focus();
    wrapper.element.setAttribute('style', 'width: 360px');
    await wrapper.setProps({ searchQuery: 'quarterly roadmap', visibleGoalCount: 1 });

    expect(wrapper.findAll('[data-testid="goal-search-input"]')).toHaveLength(1);
    expect(wrapper.get('[data-testid="goal-search-input"]').element).toBe(searchInput.element);
    expect(wrapper.get('[data-testid="goal-search-input"]').element).toBe(document.activeElement);
    expect(
      (wrapper.get('[data-testid="goal-search-input"]').element as HTMLInputElement).value,
    ).toBe('quarterly roadmap');
    const searchEvents = wrapper.emitted('search') ?? [];
    expect(searchEvents[searchEvents.length - 1]).toEqual(['quarterly roadmap']);
    wrapper.unmount();
  });
});
