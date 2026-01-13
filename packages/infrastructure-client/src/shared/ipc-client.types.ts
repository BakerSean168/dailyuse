/**
 * IPC Client Types
 *
 * Type definitions for Electron IPC communication.
 * Uses Result Pattern for unified response handling.
 * 
 * @see {@link @dailyuse/contracts/result} Result Pattern 核心模块
 */

/**
 * IPC Result format from main process
 * Main process returns this format via BaseIPCHandler.handleRequest
 */
interface IpcResultFormat<T = unknown> {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
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
 * Electron API exposed via contextBridge
 */
export interface ElectronAPI {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
  on(channel: string, callback: (...args: unknown[]) => void): void;
  off(channel: string, callback: (...args: unknown[]) => void): void;
}

/**
 * IPC Client Interface
 *
 * Wrapper around Electron's IPC for type-safe communication.
 */
export interface IpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

/**
 * Get Electron API from window
 */
export function getElectronAPI(): ElectronAPI | undefined {
  // @ts-expect-error - Electron's contextBridge exposes this
  return typeof window !== 'undefined' ? window.electronAPI : undefined;
}

/**
 * Create IPC Client
 * 
 * Automatically unwraps the IpcResult from main process.
 * Main process uses handleRequest which returns { ok, data, error } format.
 */
export function createIpcClient(): IpcClient {
  const api = getElectronAPI();
  
  return {
    invoke: async <T>(channel: string, ...args: unknown[]): Promise<T> => {
      if (!api) {
        throw new Error('Electron API not available. Are you running in Electron?');
      }
      
      const response = await api.invoke<IpcResultFormat<T> | T>(channel, ...args);
      
      // Check if response is in IpcResult format (has 'ok' property)
      if (response && typeof response === 'object' && 'ok' in response) {
        const ipcResult = response as IpcResultFormat<T>;
        
        if (ipcResult.ok) {
          // Success: return unwrapped data
          return ipcResult.data as T;
        } else if (ipcResult.error) {
          // Error: throw with details
          const error = new Error(ipcResult.error.message || 'IPC request failed');
          (error as any).code = ipcResult.error.code;
          (error as any).details = ipcResult.error.details;
          throw error;
        }
      }
      
      // Fallback: return response as-is (for handlers not using Result Pattern)
      return response as T;
    },
  };
}
