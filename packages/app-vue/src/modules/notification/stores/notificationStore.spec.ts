import { beforeEach, describe, expect, it } from 'vitest';
import { createTestPinia } from '@memoflow/test-utils';
import { useNotificationStore } from './notification-store';

describe('useNotificationStore (UI state only after Query Cache authority pilot)', () => {
  beforeEach(() => {
    createTestPinia();
  });

  it('manages pagination page/pageSize and read filter UI state', () => {
    const store = useNotificationStore();
    expect(store.pagination).toEqual({ page: 1, pageSize: 20 });
    expect(store.readFilter).toBe('all');

    store.setPage(4);
    store.setPageSize(50);
    store.setReadFilter('unread');

    expect(store.pagination).toEqual({ page: 4, pageSize: 50 });
    expect(store.readFilter).toBe('unread');

    store.reset();
    expect(store.pagination).toEqual({ page: 1, pageSize: 20 });
    expect(store.readFilter).toBe('all');
  });

  it('holds no server DTO / count / loading / error / initialized fields', () => {
    const store = useNotificationStore();
    expect(store).not.toHaveProperty('notifications');
    expect(store).not.toHaveProperty('unreadCount');
    expect(store).not.toHaveProperty('isLoading');
    expect(store).not.toHaveProperty('error');
    expect(store).not.toHaveProperty('isInitialized');
    expect(store.pagination).not.toHaveProperty('total');
  });
});
