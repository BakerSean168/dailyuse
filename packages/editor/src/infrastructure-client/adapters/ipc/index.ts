import type { IResultIpcClient } from '../types';
import { EditorIpcAdapter } from './editor-ipc.adapter';

export { EditorIpcAdapter, createEditorIpcAdapter } from './editor-ipc.adapter';

export interface EditorIpcAdapters {
  editor: EditorIpcAdapter;
}

export function createEditorIpcAdapters(ipcClient: IResultIpcClient): EditorIpcAdapters {
  return { editor: new EditorIpcAdapter(ipcClient) };
}
