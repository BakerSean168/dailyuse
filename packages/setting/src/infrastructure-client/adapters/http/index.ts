/**
 * Setting HTTP Adapters - Registration
 */

import type { IHttpClient } from '../types';
import { SettingHttpAdapter } from './setting-http.adapter';

export { SettingHttpAdapter } from './setting-http.adapter';

export interface SettingHttpAdapters {
  setting: SettingHttpAdapter;
}

export function createSettingHttpAdapters(httpClient: IHttpClient): SettingHttpAdapters {
  return { setting: new SettingHttpAdapter(httpClient) };
}
