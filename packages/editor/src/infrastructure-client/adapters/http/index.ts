import type { IResultHttpClient } from '../types';
import { EditorHttpAdapter } from './editor-http.adapter';

export { EditorHttpAdapter, createEditorHttpAdapter } from './editor-http.adapter';

export interface EditorHttpAdapters {
  editor: EditorHttpAdapter;
}

export function createEditorHttpAdapters(httpClient: IResultHttpClient): EditorHttpAdapters {
  return { editor: new EditorHttpAdapter(httpClient) };
}
