// NOTE: PowerSync adapter is currently disabled until PowerSync SDK dependencies are resolved
// import type { AbstractPowerSyncDatabase } from '@journeyapps/powersync-sdk-web';
import type { AgentRun, AgentRunResult } from '@dailyuse/contracts/ai';
import { createLogger } from '@dailyuse/utils/logger';
import type {
  AgentCheckpointDeleteInput,
  AgentCheckpointGetInput,
  AgentCheckpointListInput,
  AgentCheckpointUpsertInput,
  IAgentCheckpointPort,
} from '../../../application-server/ports';

const logger = createLogger('AgentCheckpointPowerSyncAdapter');

// Temporary stub - will be implemented when PowerSync dependencies are available
export class AgentCheckpointPowerSyncAdapter implements IAgentCheckpointPort {
  constructor(private readonly db: unknown) {
    logger.warn('PowerSync checkpoint adapter is not yet implemented');
  }

  async upsert(_input: AgentCheckpointUpsertInput): Promise<void> {
    throw new Error('PowerSync checkpoint adapter not yet implemented');
  }

  async get(_input: AgentCheckpointGetInput): Promise<AgentRunResult | null> {
    throw new Error('PowerSync checkpoint adapter not yet implemented');
  }

  async list(_input: AgentCheckpointListInput): Promise<AgentRun[]> {
    throw new Error('PowerSync checkpoint adapter not yet implemented');
  }

  async delete(_input: AgentCheckpointDeleteInput): Promise<void> {
    throw new Error('PowerSync checkpoint adapter not yet implemented');
  }

  async getThreadIndex(_identityId: string): Promise<Record<string, string>> {
    throw new Error('PowerSync checkpoint adapter not yet implemented');
  }
}
