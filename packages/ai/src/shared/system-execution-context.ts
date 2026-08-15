/**
 * System execution context for background AI runtime calls that have no
 * user-facing HTTP/IPC transport (event subscribers, cron, agent tools).
 * 为无 HTTP/IPC transport 的 AI 后台 runtime 调用（事件订阅、cron、agent 工具）
 * 构造 system execution context。
 *
 * Each invocation gets a fresh, independent request ID (never reused as a
 * durable run/proposal/checkpoint key).
 * 每次调用生成独立的新 request ID（绝不当作持久 run/proposal/checkpoint key）。
 */

import { randomUUID } from 'node:crypto';
import type { ExecutionContext } from '@memoflow/contracts/shared';

/**
 * Builds a canonical `source: 'system'` `ExecutionContext`.
 * 构造 canonical `source: 'system'` 的 `ExecutionContext`。
 *
 * @param identityId - The resolved owner identity for the background call.
 * @returns A full `ExecutionContext` with a fresh request ID.
 */
export function createSystemExecutionContext(identityId: string): ExecutionContext {
  const requestId = randomUUID();
  return {
    requestId,
    traceId: requestId,
    startedAt: Date.now(),
    source: 'system',
    identityId,
  };
}
