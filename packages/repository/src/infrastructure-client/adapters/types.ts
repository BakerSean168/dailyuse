/**
 * Repository Infrastructure Client - Port Interfaces
 */

import type { Result } from '@dailyuse/contracts/result';

export type { IRepositoryApiClient } from '../../application-client/ports/repository-api-client.port';

/**
 * IPC Client interface (Result-returning).
 * Satisfied by ResultIpcClient from @dailyuse/ipc-client at the App level.
 */
export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}
