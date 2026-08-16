/**
 * Electron IPC auth wrapper for the governance module.
 * 治理模块的 Electron IPC 鉴权包装器。
 *
 * Keeps renderer-call authentication and unexpected error normalization at the
 * Electron seam so downstream handlers can stay transport-neutral.
 * 将渲染进程调用鉴权与意外错误归一化收敛在 Electron seam，
 * 使下游处理器保持传输层无关。
 *
 * `withAuthenticatedValue` resolves the canonical Phase 2 `ExecutionContext`
 * from the profile auth context (fail-closed, never an identity-only stub).
 * `withAuthenticatedValidation` composes that context resolution with the real
 * `ipcAdapterWithValidation` so transport shape validation is adapter-owned:
 * auth/context → validation → controller. It is a composition fixture, NOT a
 * parallel validation helper — the actual `safeParse` always runs inside
 * `ipcAdapterWithValidation`.
 *
 * `withAuthenticatedValue` 从 profile auth context 解析 canonical Phase 2
 * `ExecutionContext`（fail-closed，绝不返回 identity-only stub）。
 * `withAuthenticatedValidation` 把该 context 解析与真实
 * `ipcAdapterWithValidation` 组合：auth/context → validation → controller。
 * 它是组合 fixture，而不是平行 validation helper——真正的 `safeParse` 始终在
 * `ipcAdapterWithValidation` 内部执行。
 */

import {
  createAuthenticatedIpcWrapper,
  type IElectronModuleContext,
} from '@memoflow/contracts/electron';
import type { Result } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import { ipcAdapterWithValidation } from '@memoflow/utils/result';

export const withAuthenticatedValue = createAuthenticatedIpcWrapper({
  unexpectedErrorCode: 'INTERNAL_ERROR',
  unexpectedErrorMessage: 'Governance IPC failed',
});

/** Minimal structural schema interface (avoid hard Zod dependency in the seam). */
interface ZodLikeSchema<TInput> {
  safeParse(
    data: unknown,
  ):
    | { success: true; data: TInput }
    | { success: false; error: { issues: Array<{ path: PropertyKey[]; message: string }> } };
}

/** Event-like object accepted by the IPC adapter (avoid hard Electron dependency). */
interface IpcInvokeEventLike {
  sender?: unknown;
  senderFrame?: unknown;
}

/**
 * Composes authenticated context resolution with the real validation IPC
 * adapter for a single channel. The returned handler validates the projected
 * canonical input BEFORE the controller runs and returns an `IpcResult`.
 * 把鉴权 context 解析与真实验证型 IPC adapter 组合成单通道 handler：
 * 返回的 handler 在 controller 执行前校验投影后的 canonical 输入，并返回
 * `IpcResult`。
 *
 * @param ctx - Electron module context resolving the canonical ExecutionContext.
 * @param schema - Contract request schema (single source of truth).
 * @param controllerFn - Controller invocation receiving parsed data + context.
 * @returns A `(event, args) => Promise<IpcResult<T>>` handler for `ipcMain.handle`.
 */
export function withAuthenticatedValidation<TInput, TOutput>(
  ctx: IElectronModuleContext,
  schema: ZodLikeSchema<TInput>,
  controllerFn: (data: TInput, context: ExecutionContext) => Promise<Result<TOutput>>,
): (
  event: IpcInvokeEventLike,
  args: unknown,
) => Promise<import('@memoflow/contracts/result').IpcResult<TOutput>> {
  return (event, args) =>
    withAuthenticatedValue(ctx, async (requestContext) =>
      ipcAdapterWithValidation(schema, (data) => controllerFn(data, requestContext), {
        extractContext: () => requestContext,
      })(event, args),
    );
}
