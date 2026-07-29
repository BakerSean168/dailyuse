import type { IResultHttpClient } from '@memoflow/http-client';
import { createAuthHttpAdapter } from '../infrastructure-client';
import { createAuthenticationClientService, type AuthClientService } from './services/auth-client-service';

export function createAuthenticationServiceFromHttpClient(
  httpClient: IResultHttpClient,
): AuthClientService {
  const adapter = createAuthHttpAdapter(httpClient);
  return createAuthenticationClientService(adapter);
}
