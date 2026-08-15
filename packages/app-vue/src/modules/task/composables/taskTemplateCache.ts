/**
 * Task template query cache patch helpers (module internal; plan §3.6).
 * Task template query cache 的 patch helper（模块内部，§3.6）。
 *
 * Only mutation lifecycles and instance projections call these; realtime adapters and
 * components never patch the cache directly. Snapshots are used for the §3.4 optimistic
 * update/status rollback contract (exact restore per key).
 * 只有 mutation lifecycle 与 instance projection 调用；实时适配器与组件绝不直接 patch cache。
 */

import { hashKey, type QueryClient, type QueryKey } from '@tanstack/vue-query';
import type { UpdateTaskTemplateReq } from '@memoflow/contracts/task';
import type { TaskTemplateClientDTO } from '@memoflow/contracts/task';
import { taskTemplateQueryKeys } from '../../../platform/server-state/query-keys';

/** Shape of a list/graph data payload stored under a task-template list/graph key. */
interface TemplateCollectionData {
  templates?: unknown[];
}

interface TemplateDetailData {
  id?: unknown;
}

function isCollectionData(data: unknown): data is TemplateCollectionData {
  return typeof data === 'object' && data !== null && Array.isArray((data as { templates?: unknown }).templates);
}

function isDetailFor(data: unknown, id: string): data is TemplateDetailData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in (data as Record<string, unknown>) &&
    (data as { id: unknown }).id === id
  );
}

/**
 * Read a task template from the detail cache, falling back to any cached list/graph.
 * 从 detail cache 读取模板；缺失时回退到任意已缓存的 list/graph。
 */
export function getTaskTemplateFromCache(
  queryClient: QueryClient,
  identityScope: string,
  id: string,
): TaskTemplateClientDTO | undefined {
  const detail = queryClient.getQueryData<TaskTemplateClientDTO>(
    taskTemplateQueryKeys.detail(identityScope, id),
  );
  if (detail) return detail;
  const entries = queryClient.getQueriesData<unknown>({
    queryKey: taskTemplateQueryKeys.identity(identityScope),
  });
  for (const [, data] of entries) {
    if (!isCollectionData(data)) continue;
    const found = (data.templates as TaskTemplateClientDTO[]).find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

/**
 * Patch every cached list/graph entry + detail for a task template.
 * 用 server-confirmed DTO patch 所有已缓存 list/graph 条目与 detail。
 */
export function patchTaskTemplateEverywhere(
  queryClient: QueryClient,
  identityScope: string,
  template: TaskTemplateClientDTO,
): void {
  const entries = queryClient.getQueriesData<unknown>({
    queryKey: taskTemplateQueryKeys.identity(identityScope),
  });
  for (const [queryKey, data] of entries) {
    if (!data) continue;
    if (isCollectionData(data)) {
      queryClient.setQueryData(queryKey, {
        ...data,
        templates: (data.templates as TaskTemplateClientDTO[]).map((t) =>
          t.id === template.id ? template : t,
        ),
      });
    } else if (isDetailFor(data, template.id)) {
      queryClient.setQueryData(queryKey, template);
    }
  }
  queryClient.setQueryData<TaskTemplateClientDTO>(
    taskTemplateQueryKeys.detail(identityScope, template.id),
    template,
  );
}

/**
 * Remove a server-confirmed deleted task template from every cached list/graph + detail.
 * 从所有已缓存 list/graph 与 detail 中移除 server-confirmed 删除的模板。
 */
export function removeTaskTemplateFromCache(
  queryClient: QueryClient,
  identityScope: string,
  id: string,
): void {
  const entries = queryClient.getQueriesData<unknown>({
    queryKey: taskTemplateQueryKeys.identity(identityScope),
  });
  for (const [queryKey, data] of entries) {
    if (!data) continue;
    if (isCollectionData(data)) {
      queryClient.setQueryData(queryKey, {
        ...data,
        templates: (data.templates as TaskTemplateClientDTO[]).filter((t) => t.id !== id),
      });
    } else if (isDetailFor(data, id)) {
      queryClient.removeQueries({ queryKey });
    }
  }
  queryClient.removeQueries({ queryKey: taskTemplateQueryKeys.detail(identityScope, id) });
}

/**
 * Snapshot every matching query under the identity (for optimistic rollback).
 * 快照 identity 下所有匹配 query（用于 optimistic rollback）。
 */
export function snapshotTaskTemplateCache(
  queryClient: QueryClient,
  identityScope: string,
): Array<[QueryKey, unknown]> {
  return queryClient.getQueriesData<unknown>({
    queryKey: taskTemplateQueryKeys.identity(identityScope),
  });
}

/**
 * Exactly restore a snapshot taken by `snapshotTaskTemplateCache` (per-key).
 * 逐 key 精确恢复 `snapshotTaskTemplateCache` 快照。
 */
export function restoreTaskTemplateSnapshot(
  queryClient: QueryClient,
  snapshot: Array<[QueryKey, unknown]>,
): void {
  for (const [queryKey, data] of snapshot) {
    if (data === undefined) {
      queryClient.removeQueries({ queryKey });
    } else {
      queryClient.setQueryData(queryKey, data);
    }
  }
}

/**
 * Map `UpdateTaskTemplateReq` fields onto a DTO patch (optimistic merge). Values keep the
 * transport req shape (e.g. `TaskTimeConfigReq` vs DTO `TaskTimeConfigDTO`); the merge in
 * `mergeTaskTemplateUpdate` casts back to the DTO so the cache stays a plain projection.
 * 把 `UpdateTaskTemplateReq` 字段映射为 DTO patch（optimistic 合并）。
 */
export function mapUpdateToDtoPatch(req: UpdateTaskTemplateReq): Record<string, unknown> {
  return {
    ...(req.name !== undefined ? { name: req.name } : {}),
    ...(req.description !== undefined ? { description: req.description } : {}),
    ...(req.importance !== undefined ? { importance: req.importance } : {}),
    ...(req.folderId !== undefined ? { folderId: req.folderId } : {}),
    ...(req.parentTaskId !== undefined ? { parentTaskId: req.parentTaskId } : {}),
    ...(req.tags !== undefined ? { tags: [...req.tags] } : {}),
    ...(req.color !== undefined ? { color: req.color } : {}),
    ...(req.goalBinding !== undefined ? { goalBinding: req.goalBinding } : {}),
    ...(req.timeConfig !== undefined ? { timeConfig: req.timeConfig } : {}),
    ...(req.recurrenceRule !== undefined ? { recurrenceRule: req.recurrenceRule } : {}),
    ...(req.reminderConfig !== undefined ? { reminderConfig: req.reminderConfig } : {}),
  };
}

/**
 * Build an optimistic template by merging an update request into the cached entry.
 * 通过把 update request 合并进已缓存条目构造 optimistic 模板（无缓存时返回 undefined）。
 */
export function mergeTaskTemplateUpdate(
  queryClient: QueryClient,
  identityScope: string,
  id: string,
  req: UpdateTaskTemplateReq,
): TaskTemplateClientDTO | undefined {
  const cached = getTaskTemplateFromCache(queryClient, identityScope, id);
  if (!cached) return undefined;
  return {
    ...cached,
    ...(mapUpdateToDtoPatch(req) as Partial<TaskTemplateClientDTO>),
    version: cached.version + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Wait until a query key reaches `success` (imperative facade callers await this).
 * 等待指定 query key 达到 success（命令式 facade 调用方 await 它）。
 */
export function waitForTaskTemplateQuery(
  queryClient: QueryClient,
  queryKey: QueryKey,
): Promise<void> {
  const state = queryClient.getQueryState(queryKey);
  if (state?.status === 'success') return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (
        event.type === 'updated' &&
        hashKey(event.query.queryKey) === hashKey(queryKey) &&
        event.query.state.status === 'success'
      ) {
        unsubscribe();
        resolve();
      }
    });
  });
}
