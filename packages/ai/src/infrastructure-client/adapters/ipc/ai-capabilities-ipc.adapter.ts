import { AIChannels } from '@dailyuse/contracts/electron';
import type { AICapabilities } from '@dailyuse/contracts/ai';
import type { IAICapabilitiesApiClient, IResultIpcClient } from '../types';

export class AICapabilitiesIpcAdapter implements IAICapabilitiesApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getCapabilities(): Promise<AICapabilities> {
    const result = await this.ipcClient.invoke<AICapabilities>(AIChannels.CAPABILITIES_GET);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
