/** @vitest-environment happy-dom */

import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';
import type { NotificationClientDTO } from '@memoflow/contracts/notification';
import InAppNotification from './InAppNotification.vue';
import NotificationItem from './NotificationItem.vue';

vi.mock('../../../components/shared', async () => {
  const { defineComponent, h } = await import('vue');
  return {
    ActionableWrapper: defineComponent({
      setup(_, { slots }) {
        return () => h('div', slots.default?.());
      },
    }),
    menuLabel: (key: string) => key,
  };
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: { close: 'Close' },
      notification: {
        item: { priorityVital: 'Vital', priorityImportant: 'Important' },
        action: { openRelated: 'Open related item' },
      },
    },
  },
});

const notification = {
  id: 'notification-1',
  identityId: 'identity-1',
  title: 'Build finished',
  content: 'The build completed successfully.',
  type: 'SYSTEM',
  category: 'System',
  importance: 'Moderate',
  isRead: false,
  readAt: null,
  status: 'Delivered',
  actions: null,
  metadata: null,
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  deletedAt: null,
  notificationChannels: null,
} as NotificationClientDTO;

describe('notification semantic controls', () => {
  it('renders a list notification action as a named button', () => {
    const wrapper = mount(NotificationItem, {
      props: { notification },
      global: { plugins: [i18n] },
    });
    const action = wrapper.get('[data-testid="notification-item"]');

    expect(action.element.tagName).toBe('BUTTON');
    expect(action.attributes('type')).toBe('button');
    expect(action.attributes('aria-label')).toBe('Build finished');
  });

  it('renders Fact context without exposing delivery internals', () => {
    const wrapper = mount(NotificationItem, {
      props: {
        notification: {
          ...notification,
          topic: 'Task completed',
          category: 'Task',
          relatedEntityType: 'Task',
          relatedEntityId: 'task-42',
          navigationIntent: { route: '/tasks/task-42' },
        },
      },
      global: { plugins: [i18n] },
    });

    expect(wrapper.text()).toContain('Task completed');
    expect(wrapper.text()).toContain('task-42');
    expect(wrapper.text()).toContain('Open related item');
    expect(wrapper.text()).not.toContain('Delivered');
    expect(wrapper.find('[data-testid="notification-item"]').element.tagName).toBe('BUTTON');
  });

  it('keeps toast content and close as separate named buttons', () => {
    const wrapper = mount(InAppNotification, {
      props: {
        notifications: [
          {
            id: 'toast-1',
            title: 'Reminder due',
            message: 'Stand up and stretch.',
            type: 'REMINDER',
            priority: 'NORMAL',
          },
        ],
      },
      global: {
        plugins: [i18n],
        stubs: { Teleport: true, TransitionGroup: false },
      },
    });
    const buttons = wrapper.findAll('button');

    expect(buttons).toHaveLength(2);
    expect(buttons[0].attributes('aria-label')).toBe('Reminder due');
    expect(buttons[1].attributes('aria-label')).toBe('Close');
  });
});
