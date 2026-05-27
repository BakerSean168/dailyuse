import type { IResultHttpClient } from '@dailyuse/http-client';
import { createEditorHttpAdapter } from '../infrastructure-client';
import { createEditorClientService, type EditorClientService } from './editor-client-service';

export function createEditorServiceFromHttpClient(
  httpClient: IResultHttpClient,
): EditorClientService {
  const adapter = createEditorHttpAdapter(httpClient);
  return createEditorClientService(adapter);
}
