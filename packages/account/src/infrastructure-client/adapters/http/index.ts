/**
 * Account HTTP Adapters - Registration
 */

import type { IResultHttpClient } from '../types';
import { AccountHttpAdapter } from './account-http.adapter';

export { AccountHttpAdapter, createAccountHttpAdapter } from './account-http.adapter';

export interface AccountHttpAdapters {
  account: AccountHttpAdapter;
}

export function createAccountHttpAdapters(httpClient: IResultHttpClient): AccountHttpAdapters {
  return {
    account: new AccountHttpAdapter(httpClient),
  };
}
