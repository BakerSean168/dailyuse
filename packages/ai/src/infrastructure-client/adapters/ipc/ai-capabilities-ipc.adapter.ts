import { AIChannels } from '@dailyuse/contracts/electron';
import type { AICapabilities } from '@dailyuse/contracts/ai';
import type { Result } from '@dailyuse/contracts/result';
import type { IAICapabilitiesApiClient, IResultIpcClient } from '../types';

/**
 * IPC adapter for AI capabilities.
 * Returns Result envelopes — never throws (residual 97).
 */
export class AICapabilitiesIpcAdapter implements IAICapabilitiesApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async getCapabilities(): Promise<Result<AICapabilities>> {
    return this.ipcClient.invoke<AICapabilities>(AIChannels.CAPABILITIES_GET);
  }
}
