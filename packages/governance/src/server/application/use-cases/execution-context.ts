/**
 * Governance re-exports the canonical shared ExecutionContext.
 * 治理复用 canonical 的共享 ExecutionContext。
 *
 * No private `ExecutionContext` body lives here — 
 * `packages/contracts/src/shared/execution-context.ts` is the single interface
 * body in the repository (RefArch Phase 2).
 *
 * 本文件不定义私有 `ExecutionContext` body —
 * `packages/contracts/src/shared/execution-context.ts` 是仓库中唯一的
 * interface body（RefArch 阶段 2）。
 */

export type {
  ExecutionContext,
  ExecutionSource,
  RequestContext,
} from '@memoflow/contracts/shared';
