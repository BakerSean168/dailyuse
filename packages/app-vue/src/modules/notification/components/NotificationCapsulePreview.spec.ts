/** @vitest-environment jsdom */

import { computed, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { NotificationClientDTO } from '@memoflow/contracts/notification';
import NotificationCapsulePreview from './NotificationCapsulePreview.vue';

const notificationsRef = ref<NotificationClientDTO[]>([]);
const unreadCountRef = ref(0);
const isLoadingRef = ref(false);

const fetchNotifications = vi.fn().mockResolvedValue(undefined);
const markAsRead = vi.fn().mockResolvedValue(undefined);
const markAllAsRead = vi.fn().mockResolvedValue(undefined);
const refreshStats = vi.fn().mockResolvedValue(undefined);

vi.mock('../composables/useNotification', () => ({
  useNotification: () => ({
    notifications: computed(() => notificationsRef.value),
    hasUnread: computed(() => unreadCountRef.value > 0),
    isLoading: computed(() => isLoadingRef.value),
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshStats,
  }),
}));

vi.mock('vue-sonner', () => ({
  toast: { success: vi.fn() },
}));

vi.mock('@memoflow/ui-vue-shadcn', async () => {
  const vue = await import('vue');
  const Button = vue.defineComponent({
    name: 'ButtonStub',
    props: {
      variant: String,
      size: String,
      disabled: Boolean,
    },
    emits: ['click'],
    setup(props, { slots, emit, attrs }) {
      return () =>
        vue.h(
          'button',
          {
            type: 'button',
            ...attrs,
            disabled: props.disabled,
            onClick: () => emit('click'),
          },
          slots.default?.(),
        );
    },
  });
  return { Button };
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      notification: {
        empty: 'No notifications',
        drawer: {
          title: 'Notification Center',
          viewAll: 'View all notifications',
        },
        action: {
          markAllRead: 'Mark all read',
        },
        toast: {
          allMarkedRead: 'All marked as read',
        },
      },
    },
  },
});

function createNotification(overrides: Partial<NotificationClientDTO> = {}): NotificationClientDTO {
  return {
    id: 'n-1',
    identityId: 'u-1',
    title: 'Hello',
    content: 'Body',
    type: 'Info',
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
    ...overrides,
  } as NotificationClientDTO;
}

function mountPreview() {
  return mount(NotificationCapsulePreview, {
    global: {
      plugins: [i18n],
    },
  });
}

describe('NotificationCapsulePreview (V2 §6.5)', () => {
  afterEach(() => {
    notificationsRef.value = [];
    unreadCountRef.value = 0;
    isLoadingRef.value = false;
    vi.clearAllMocks();
  });

  it('loads recent notifications on mount and shows mark-all when unread', async () => {
    notificationsRef.value = [
      createNotification({ id: 'n-1' as NotificationClientDTO['id'], title: 'A', isRead: false }),
      createNotification({
        id: 'n-2' as NotificationClientDTO['id'],
        title: 'B',
        isRead: true,
        createdAt: Date.now() - 1000,
      }),
    ];
    unreadCountRef.value = 1;

    const wrapper = mountPreview();
    await nextTick();
    await nextTick();

    expect(fetchNotifications).toHaveBeenCalled();
    expect(refreshStats).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="notification-capsule-preview"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="notification-capsule-mark-all-read"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="notification-capsule-view-all"]').text()).toContain(
      'View all notifications',
    );
    expect(wrapper.findAll('[data-testid^="notification-capsule-item-"]')).toHaveLength(2);
    const firstItemAction = wrapper.get('[data-testid="notification-capsule-item-n-1"] button');
    expect(firstItemAction.attributes('type')).toBe('button');
    expect(firstItemAction.attributes('aria-label')).toBe('A');

    await wrapper.get('[data-testid="notification-capsule-mark-all-read"]').trigger('click');
    await nextTick();
    expect(markAllAsRead).toHaveBeenCalled();

    wrapper.unmount();
  });

  it('emits view-all when the footer action is clicked', async () => {
    notificationsRef.value = [];
    const wrapper = mountPreview();
    await nextTick();

    await wrapper.get('[data-testid="notification-capsule-view-all"]').trigger('click');
    expect(wrapper.emitted('view-all')).toBeTruthy();
    wrapper.unmount();
  });

  it('marks an unread item as read when clicked', async () => {
    notificationsRef.value = [
      createNotification({ id: 'n-9' as NotificationClientDTO['id'], isRead: false }),
    ];
    unreadCountRef.value = 1;
    const wrapper = mountPreview();
    await nextTick();

    await wrapper.get('[data-testid="notification-capsule-item-n-9"] button').trigger('click');
    await nextTick();
    expect(markAsRead).toHaveBeenCalledWith('n-9');
    wrapper.unmount();
  });
});
