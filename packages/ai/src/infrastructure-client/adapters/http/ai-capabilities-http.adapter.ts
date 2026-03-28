import type { AICapabilities } from '@dailyuse/contracts/ai';
import type { IAICapabilitiesApiClient, IResultHttpClient } from '../types';
import { unwrapResultOrThrow } from '../result-client-error';

export class AICapabilitiesHttpAdapter implements IAICapabilitiesApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async getCapabilities(): Promise<AICapabilities> {
    const result = await this.httpClient.get<AICapabilities>('/ai/capabilities');
    return unwrapResultOrThrow(result);
  }
}
