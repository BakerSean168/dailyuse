/**
 * IPC Result Unwrap Utility
 *
 * Helper function to unwrap IpcResult format from main process.
 * Main process uses BaseIPCHandler which returns { ok, data, error, meta } format.
 *
 * This is necessary because:
 * 1. Main process wraps all responses in IpcResult format
 * 2. Vite dev server uses source files directly, bypassing our IpcClient modifications
 * 3. We need consistent handling across all IPC adapters
 */

/**
 * IPC Result format from main process
 */
interface IpcResultFormat<T = unknown> {
  ok: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    traceId?: string;
    duration?: number;
    timestamp?: number;
  };
}

/**
 * Unwrap IpcResult format to extract the actual data
 *
 * @param response - Raw response from IPC invoke (may be IpcResult or raw data)
 * @returns Unwrapped data
 * @throws Error if response indicates failure
 *
 * @example
 * ```ts
 * const response = await ipcClient.invoke('goal:list');
 * const goals = unwrapIpcResult<Goal[]>(response);
 * ```
 */
export function unwrapIpcResult<T>(response: unknown): T {
  // Check if response is in IpcResult format (has 'ok' property)
  if (response && typeof response === 'object' && 'ok' in response) {
    const ipcResult = response as IpcResultFormat<T>;

    if (ipcResult.ok) {
      // Success: return unwrapped data (may be undefined for void operations)
      return ipcResult.data as T;
    }

    // Error: throw with details
    if (ipcResult.error) {
      const error = new Error(ipcResult.error.message || 'IPC request failed');
      (error as any).code = ipcResult.error.code;
      (error as any).details = ipcResult.error.details;
      throw error;
    }

    // ok=false but no error details
    throw new Error('IPC request failed with unknown error');
  }

  // Not IpcResult format - return as-is (backward compatibility)
  return response as T;
}
