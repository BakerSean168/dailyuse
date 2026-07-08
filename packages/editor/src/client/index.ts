/**
 * Editor client seam.
 *
 * Public editor contracts stay centralized in `@dailyuse/contracts/editor`.
 * Callers depend on this seam instead of the old application-client /
 * infrastructure-client layered exports.
 */

import type { IResultHttpClient } from '@dailyuse/http-client';
import {
  createEditorClientService,
  type EditorClientPort,
} from '../application-client';
import {
  EditorHttpAdapter,
  createEditorHttpAdapters,
  type EditorHttpAdapters,
} from '../infrastructure-client/adapters/http';
import {
  EditorIpcAdapter,
  createEditorIpcAdapters,
  type EditorIpcAdapters,
} from '../infrastructure-client/adapters/ipc';
import type {
  IEditorApiClient,
  IResultIpcClient,
  EditorContentReadResult,
  SaveEditorContentRequest,
} from '../infrastructure-client/adapters/types';

export type {
  EditorClientPort,
  EditorHttpAdapters,
  EditorIpcAdapters,
  IEditorApiClient,
  IResultHttpClient,
  IResultIpcClient,
  EditorContentReadResult,
  SaveEditorContentRequest,
};

export function createEditorHttpClient(
  httpClient: IResultHttpClient,
): EditorClientPort {
  return createEditorClientService(new EditorHttpAdapter(httpClient));
}

export function createEditorIpcClient(
  ipcClient: IResultIpcClient,
): EditorClientPort {
  return createEditorClientService(new EditorIpcAdapter(ipcClient));
}

export {
  EditorHttpAdapter,
  EditorIpcAdapter,
  createEditorHttpAdapters,
  createEditorIpcAdapters,
};
