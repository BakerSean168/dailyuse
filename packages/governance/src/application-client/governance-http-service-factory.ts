import type { IResultHttpClient } from '@dailyuse/http-client';
import { createRuleHttpAdapter } from '../infrastructure-client';
import { createGovernanceClientService, type GovernanceClientService } from './services/governance-client-service';

export function createGovernanceServiceFromHttpClient(
  httpClient: IResultHttpClient,
): GovernanceClientService {
  const adapter = createRuleHttpAdapter(httpClient);
  return createGovernanceClientService(adapter);
}
