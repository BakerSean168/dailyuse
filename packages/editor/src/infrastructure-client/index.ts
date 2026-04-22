export type {
  IEditorApiClient,
  EditorContentReadResult,
  SaveEditorContentRequest,
  IResultIpcClient,
  IResultHttpClient,
} from './adapters/types';

export {
  EditorHttpAdapter,
  createEditorHttpAdapter,
  createEditorHttpAdapters,
  type EditorHttpAdapters,
} from './adapters/http';

export {
  EditorIpcAdapter,
  createEditorIpcAdapter,
  createEditorIpcAdapters,
  type EditorIpcAdapters,
} from './adapters/ipc';
