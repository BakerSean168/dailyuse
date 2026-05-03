import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';

// Re-export port interfaces from application-client ports
export type {
  IEditorApiClient,
  EditorContentReadResult,
  SaveEditorContentRequest,
} from '../../application-client/ports/editor-api-client.port';

export interface IResultIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<Result<T>>;
}

export type { IResultHttpClient };
