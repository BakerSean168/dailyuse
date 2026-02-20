/**
 * IPC Adapter
 *
 * 将 Controller 函数适配为 Electron IPC 处理器。
 * 统一处理上下文提取、错误处理和 IpcResult 序列化。
 *
 * 所有 Zod 验证必须在 Controller 内部完成（Plan B 策略）。
 *
 * @module @dailyuse/utils/result/ipc-adapter
 *
 * @example
 * ```ts
 * import { ipcAdapter } from '@dailyuse/utils/result';
 *
 * // Controller handles validation internally
 * ipcMain.handle('goal:get', ipcAdapter(
 *   (args, ctx) => controller.get(args.id),
 * ));
 *
 * ipcMain.handle('goal:create', ipcAdapter(
 *   (args, ctx) => controller.create(args, ctx),
 * ));
 * ```
 */

import {
  type Result,
  type IpcResult,
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
        err instanceof Error && 'code' in err && typeof (err as Record<string, unknown>).code === 'string'
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
