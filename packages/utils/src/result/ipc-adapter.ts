/**
 * IPC Adapter
 *
 * 将 Controller 函数适配为 Electron IPC 处理器。
 * 统一处理上下文提取、错误处理和 IpcResult 序列化。
 *
 * Two variants:
 *   - `ipcAdapter`                 — Controller receives raw (args, ctx)
 *   - `ipcAdapterWithValidation`  — Validates args via Zod schema first
 *
 * @module @dailyuse/utils/result/ipc-adapter
 *
 * @example
 * ```ts
 * import { ipcAdapter, ipcAdapterWithValidation } from '@dailyuse/utils/result';
 *
 * // Controller handles validation internally
 * ipcMain.handle('goal:get', ipcAdapter(
 *   (args, ctx) => controller.get(args.id),
 * ));
 *
 * // Adapter validates args first, then passes parsed data to controller
 * ipcMain.handle('goal:create', ipcAdapterWithValidation(CreateGoalSchema,
 *   (data, ctx) => controller.create(data, ctx),
 * ));
 * ```
 */

import {
  type Result,
  type IpcResult,
  type ResultErrorDetail,
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

// ============================================================================
// IPC Adapter
// ============================================================================

/**
 * Adapt a controller function to an IPC handler.
 *
 * Validation is handled inside the controller (Plan B).
 *
 * @example
 * ```ts
 * ipcMain.handle('goal:get', ipcAdapter(
 *   (args, ctx) => controller.get(args.id),
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
      // Recognize DomainError (or any Error with a string `code`) and preserve code
      const code =
        err instanceof Error &&
        'code' in err &&
        typeof (err as Record<string, unknown>).code === 'string'
          ? ((err as Record<string, unknown>).code as string)
          : 'INTERNAL_ERROR';
      return toIpcResult(
        fail({
          code,
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
      );
    }
  };
}

// ============================================================================
// IPC Adapter with Validation
// ============================================================================

/**
 * Zod-like schema interface (avoid hard Zod dependency)
 */
interface ZodLikeSchema<T> {
  safeParse(
    data: unknown,
  ):
    | { success: true; data: T }
    | { success: false; error: { issues: Array<{ path: PropertyKey[]; message: string }> } };
}

/**
 * Format Zod issues into ResultErrorDetail array
 */
function formatZodErrors(
  issues: Array<{ path: PropertyKey[]; message: string }>,
): ResultErrorDetail[] {
  return issues.map((issue) => ({
    field: issue.path.map(String).join('.'),
    code: 'INVALID_FIELD',
    message: issue.message,
  }));
}

/**
 * Adapt a controller function to an IPC handler with upfront Zod validation.
 *
 * The adapter validates args against the schema first, then calls the controller
 * with (parsedData, context). If validation fails, it returns VALIDATION_ERROR.
 *
 * @example
 * ```ts
 * ipcMain.handle('goal:create', ipcAdapterWithValidation(CreateGoalSchema,
 *   (data, ctx) => controller.create(data, ctx),
 * ));
 * ```
 */
export function ipcAdapterWithValidation<TInput, TOutput>(
  schema: ZodLikeSchema<TInput>,
  controllerFn: (data: TInput, context: Context) => Promise<Result<TOutput>>,
  options: IpcAdapterOptions = {},
): (event: IpcInvokeEvent, args: unknown) => Promise<IpcResult<TOutput>> {
  const { extractContext = defaultExtractContext } = options;

  return async (event: IpcInvokeEvent, args: unknown): Promise<IpcResult<TOutput>> => {
    try {
      // Validate args
      const parsed = schema.safeParse(args);
      if (!parsed.success) {
        const details = formatZodErrors(parsed.error.issues);
        return toIpcResult(
          fail({
            code: 'VALIDATION_ERROR',
            message: '参数验证失败',
            details,
          }),
        );
      }

      const context = extractContext(event);
      const result = await controllerFn(parsed.data, context);
      return toIpcResult(result);
    } catch (err) {
      const code =
        err instanceof Error &&
        'code' in err &&
        typeof (err as Record<string, unknown>).code === 'string'
          ? ((err as Record<string, unknown>).code as string)
          : 'INTERNAL_ERROR';
      return toIpcResult(
        fail({
          code,
          message: err instanceof Error ? err.message : 'Unknown error',
        }),
      );
    }
  };
}
