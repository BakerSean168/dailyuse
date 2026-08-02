import { describe, expect, it } from 'vitest';
import { resolvePanelRouteIdentity } from './panel-cache-key';

describe('resolvePanelRouteIdentity', () => {
  it('keeps nested list and detail routes on one cached module layout', () => {
    const list = [
      { name: 'shell', components: { default: {} } },
      { name: 'goals', components: { default: {} } },
      { name: 'goal-list', components: { default: {} } },
    ];
    const detail = [
      { name: 'shell', components: { default: {} } },
      { name: 'goals', components: { default: {} } },
      { name: 'goal-detail', components: { default: {} } },
    ];

    expect(resolvePanelRouteIdentity(list, '/goals')).toBe('goals');
    expect(resolvePanelRouteIdentity(detail, '/goals/goal-1')).toBe('goals');
  });

  it('separates leaf components when a module route has no layout component', () => {
    const list = [
      { name: 'shell', components: { default: {} } },
      { name: 'tasks' },
      { name: 'task-list', components: { default: {} } },
    ];
    const detail = [
      { name: 'shell', components: { default: {} } },
      { name: 'tasks' },
      { name: 'task-detail', components: { default: {} } },
    ];

    expect(resolvePanelRouteIdentity(list, '/tasks')).toBe('task-list');
    expect(resolvePanelRouteIdentity(detail, '/tasks/task-1')).toBe('task-detail');
  });
});
