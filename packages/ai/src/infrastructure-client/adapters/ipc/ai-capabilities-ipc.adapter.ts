import { AIChannels } from '@dailyuse/contracts/electron';
import type { AICapabilities } from '@dailyuse/contracts/ai';
import type { IAICapabilitiesApiClient, IResultIpcClient } from '../types';
import { unwrapResultOrThrow } from '../result-client-error';

export class AICapabilitiesIpcAdapter implements IAICapabilitiesApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getCapabilities(): Promise<AICapabilities> {
    const result = await this.ipcClient.invoke<AICapabilities>(AIChannels.CAPABILITIES_GET);
    return unwrapResultOrThrow(result);
  }
}
