import { describe, expect, it } from 'vitest';
import {
  canonicalizeNotificationListQuery,
  canonicalizeTaskTemplateListQuery,
  notificationQueryKeys,
  taskTemplateQueryKeys,
} from './query-keys';

describe('notificationQueryKeys (plan §3.2 frozen shape)', () => {
  it('builds the frozen key hierarchy', () => {
    expect(notificationQueryKeys.all).toEqual(['server-state', 'notification']);
    expect(notificationQueryKeys.identity('id-1')).toEqual([
      'server-state',
      'notification',
      'id-1',
    ]);
    expect(notificationQueryKeys.lists('id-1')).toEqual([
      'server-state',
      'notification',
      'id-1',
      'list',
    ]);
    expect(notificationQueryKeys.list('id-1', { page: 1, limit: 20 })).toEqual([
      'server-state',
      'notification',
      'id-1',
      'list',
      { page: 1, limit: 20 },
    ]);
    expect(notificationQueryKeys.details('id-1')).toEqual([
      'server-state',
      'notification',
      'id-1',
      'detail',
    ]);
    expect(notificationQueryKeys.detail('id-1', 'n-1')).toEqual([
      'server-state',
      'notification',
      'id-1',
      'detail',
      'n-1',
    ]);
    expect(notificationQueryKeys.unread('id-1')).toEqual([
      'server-state',
      'notification',
      'id-1',
      'unread-count',
    ]);
  });

  it('isolates identities in every key segment', () => {
    const a = notificationQueryKeys.list('identity-a', { page: 1, limit: 20 });
    const b = notificationQueryKeys.list('identity-b', { page: 1, limit: 20 });
    expect(a).not.toEqual(b);
  });

  it('keeps different list params on different keys', () => {
    const page1 = notificationQueryKeys.list('id', { page: 1, limit: 20 });
    const page2 = notificationQueryKeys.list('id', { page: 2, limit: 20 });
    const capsule = notificationQueryKeys.list('id', { page: 1, limit: 10 });
    expect(page1).not.toEqual(page2);
    expect(page1).not.toEqual(capsule);
  });
});

describe('canonicalizeNotificationListQuery', () => {
  it('materializes pagination defaults and drops undefined', () => {
    expect(canonicalizeNotificationListQuery()).toEqual({ page: 1, limit: 20 });
    expect(canonicalizeNotificationListQuery({ page: 2 })).toEqual({ page: 2, limit: 20 });
    expect(canonicalizeNotificationListQuery({ limit: 10 })).toEqual({ page: 1, limit: 10 });
  });

  it('keeps primitive filters in frozen field order', () => {
    const canonical = canonicalizeNotificationListQuery({
      limit: 50,
      isRead: true,
      type: 'Reminder',
      endDate: 200,
      page: 3,
      startDate: 100,
    });
    expect(Object.keys(canonical)).toEqual(['page', 'limit', 'type', 'isRead', 'startDate', 'endDate']);
    expect(canonical.startDate).toBe('100');
    expect(canonical.endDate).toBe('200');
  });

  it('rejects nothing at runtime but ignores non-primitive fields at the type boundary', () => {
    const canonical = canonicalizeNotificationListQuery({ page: 1, limit: 20 });
    expect(canonical).not.toHaveProperty('keyword');
  });
});

describe('taskTemplateQueryKeys (plan §3.2 frozen shape)', () => {
  it('builds the frozen key hierarchy', () => {
    expect(taskTemplateQueryKeys.all).toEqual(['server-state', 'task-template']);
    expect(taskTemplateQueryKeys.identity('id-1')).toEqual([
      'server-state',
      'task-template',
      'id-1',
    ]);
    expect(taskTemplateQueryKeys.list('id-1', { page: 1, limit: 20 })).toEqual([
      'server-state',
      'task-template',
      'id-1',
      'list',
      { page: 1, limit: 20 },
    ]);
    expect(taskTemplateQueryKeys.detail('id-1', 't-1')).toEqual([
      'server-state',
      'task-template',
      'id-1',
      'detail',
      't-1',
    ]);
    expect(taskTemplateQueryKeys.graph('id-1', { page: 1, limit: 20 })).toEqual([
      'server-state',
      'task-template',
      'id-1',
      'graph',
      { page: 1, limit: 20 },
    ]);
  });

  it('separates list / detail / graph projections so they never share a key', () => {
    const list = taskTemplateQueryKeys.list('id', { page: 1, limit: 20 });
    const graph = taskTemplateQueryKeys.graph('id', { page: 1, limit: 20 });
    expect(list).not.toEqual(graph);
  });

  it('prefix targeting reaches list/graph/details independently', () => {
    const listPrefix = taskTemplateQueryKeys.lists('id');
    const graphPrefix = taskTemplateQueryKeys.graphs('id');
    expect(taskTemplateQueryKeys.list('id', { page: 1, limit: 20 }).slice(0, 3)).toEqual(
      listPrefix.slice(0, 3),
    );
    expect(taskTemplateQueryKeys.graph('id', { page: 1, limit: 20 }).slice(0, 3)).toEqual(
      graphPrefix.slice(0, 3),
    );
  });
});

describe('canonicalizeTaskTemplateListQuery', () => {
  it('materializes pagination defaults and preserves explicit limit', () => {
    expect(canonicalizeTaskTemplateListQuery()).toEqual({ page: 1, limit: 20 });
    expect(canonicalizeTaskTemplateListQuery({ limit: 50 })).toEqual({ page: 1, limit: 50 });
  });

  it('normalizes status/tags arrays (copy, dedupe, sort) and drops empty arrays', () => {
    const canonical = canonicalizeTaskTemplateListQuery({
      page: 1,
      limit: 20,
      status: ['Active', 'Active', 'Paused'],
      tags: ['b', 'a', 'b'],
    });
    expect(canonical.status).toEqual(['Active', 'Paused']);
    expect(canonical.tags).toEqual(['a', 'b']);

    const empty = canonicalizeTaskTemplateListQuery({ status: [], tags: [] });
    expect(empty).not.toHaveProperty('status');
    expect(empty).not.toHaveProperty('tags');
  });

  it('keeps scalar filters and puts arrays into the frozen field order', () => {
    const canonical = canonicalizeTaskTemplateListQuery({
      goalId: 'g-1',
      folderId: 'f-1',
      status: ['Active'],
      page: 2,
      tags: ['x'],
      limit: 10,
    });
    expect(Object.keys(canonical)).toEqual(['page', 'limit', 'status', 'goalId', 'folderId', 'tags']);
  });

  it('produces equal keys for semantically equal requests regardless of array order', () => {
    const a = canonicalizeTaskTemplateListQuery({ status: ['Active', 'Paused'] });
    const b = canonicalizeTaskTemplateListQuery({ status: ['Paused', 'Active'] });
    expect(a).toEqual(b);
  });
});
