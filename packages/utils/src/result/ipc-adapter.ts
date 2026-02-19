/**
 * IPC Adapter
 *
 * 将 Controller/UseCase 函数适配为 Electron IPC 处理器。
 * 统一处理 Zod 验证、上下文提取、错误处理和 IpcResult 序列化。
 *
 * @module @dailyuse/utils/result/ipc-adapter
 *
 * @example
 * ```ts
 * import { ipcAdapter, ipcAdapterWithValidation } from '@dailyuse/utils/result';
 *
 * // 无验证
 * ipcMain.handle('goal:get', ipcAdapter(
 *   (args, ctx) => goalUseCases.getGoal.execute(args.id),
 * ));
 *
 * // 带 Zod 验证
 * ipcMain.handle('goal:create', ipcAdapterWithValidation(
 *   CreateGoalSchema,
 *   (data, ctx) => goalUseCases.createGoal.execute(data, ctx),
 * ));
 * ```
 */

import {
  type Result,
  type ResultErrorDetail,
  type IpcResult,
  isOk,
  toIpcResult,
  fail,
} from '@dailyuse/contracts/result';
import type { Context } from '@dailyuse/contracts/shared';

// ============================================================================
// Types
// ============================================================================

/**
 * IPC invoke event interface (avoid hard Electron dependency)
 */
interface IpcInvokeEvent {
  sender?: unknown;
  senderFrame?: unknown;
}

/**
 * Zod-like schema interface (avoid hard Zod dependency)
 */
interface ZodLikeSchema<T = unknown> {
  safeParse(data: unknown): { success: true; data: T } | { success: false; error: { issues: Array<{ path: (string | number)[]; message: string }> } };
}

/**
 * Options for the IPC adapter
 */
export interface IpcAdapterOptions {
  /** Custom context extractor */
  extractContext?: (event: IpcInvokeEvent) => Context;
}

// ============================================================================
// Default Helpers
// ============================================================================

/**
 * Default context extractor from IPC event
 */
function defaultExtractContext(_event: IpcInvokeEvent): Context {
  return {
    identityId: '',
    deviceId: 'desktop',
  };
}

/**
 * Format Zod issues into ResultErrorDetail array
 */
function formatZodErrors(issues: Array<{ path: (string | number)[]; message: string }>): ResultErrorDetail[] {
  return issues.map((issue) => ({
    field: issue.path.join('.'),
    code: 'INVALID_FIELD',
    message: issue.message,
  }));
}

// ============================================================================
// IPC Adapters
// ============================================================================

/**
 * Adapt a controller function to an IPC handler.
 *
 * Use this for IPC handlers that do NOT need input validation,
 * or when validation is handled inside the controller.
 *
 * @example
 * ```ts
 * ipcMain.handle('goal:get', ipcAdapter(
 *   (args, ctx) => goalUseCases.getGoal.execute(args.id),
 * ));
 * ```
 */
export function ipcAdapter<T>(
  controllerFn: (args: unknown, context: Context) => Promise<Result<T>>,
  options: IpcAdapterOptions = {},
): (event: IpcInvokeEvent, args: unknown) => Promise<IpcResult<T>> {
  const { extractContext = defaultExtractContext } = options;

  return async (event: IpcInvokeEvent, args: unknown): Promise<IpcResult<T>> => {
    try {
      const context = extractContext(event);
      const result = await controllerFn(args, context);
      return toIpcResult(result);
    } catch (err) {
      return toIpcResult(
        fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
      );
    }
  };
}

/**
 * Adapt a controller function with Zod validation to an IPC handler.
 *
 * Automatically validates the incoming args against the provided Zod schema,
 * extracts the context, and formats errors consistently.
 *
 * @example
 * ```ts
 * ipcMain.handle('goal:create', ipcAdapterWithValidation(
 *   CreateGoalSchema,
 *   (data, ctx) => goalUseCases.createGoal.execute(data, ctx),
 * ));
 * ```
 */
export function ipcAdapterWithValidation<T, S>(
  schema: ZodLikeSchema<S>,
  controllerFn: (data: S, context: Context) => Promise<Result<T>>,
  options: IpcAdapterOptions = {},
): (event: IpcInvokeEvent, args: unknown) => Promise<IpcResult<T>> {
  const { extractContext = defaultExtractContext } = options;

  return async (event: IpcInvokeEvent, args: unknown): Promise<IpcResult<T>> => {
    try {
      // Validate input
      const parsed = schema.safeParse(args);
      if (!parsed.success) {
        const details = formatZodErrors(parsed.error.issues);
        return toIpcResult(
          fail({
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details,
          }),
        );
      }

      const context = extractContext(event);
      const result = await controllerFn(parsed.data, context);
      return toIpcResult(result);
    } catch (err) {
      return toIpcResult(
        fail({
          code: 'INTERNAL_ERROR',
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
      );
    }
  };
}
