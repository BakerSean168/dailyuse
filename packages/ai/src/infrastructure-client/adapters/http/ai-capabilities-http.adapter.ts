import type { AICapabilities } from '@dailyuse/contracts/ai';
import type { IAICapabilitiesApiClient, IResultHttpClient } from '../types';

export class AICapabilitiesHttpAdapter implements IAICapabilitiesApiClient {
  constructor(private readonly httpClient: IResultHttpClient) {}

  async getCapabilities(): Promise<AICapabilities> {
    const result = await this.httpClient.get<AICapabilities>('/ai/capabilities');
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
