import type {
  AgentCheckpointDeleteInput,
  AgentCheckpointGetInput,
  AgentCheckpointListInput,
  AgentCheckpointUpsertInput,
  IAgentCheckpointPort,
} from '../application/ports';
import type { AgentRun, AgentRunResult } from '@dailyuse/contracts/ai';

export class AIAgentCheckpointController {
  constructor(private readonly checkpointPort: IAgentCheckpointPort) {}

  async upsertCheckpoint(input: AgentCheckpointUpsertInput): Promise<void> {
    await this.checkpointPort.upsert(input);
  }

  async getCheckpoint(input: AgentCheckpointGetInput): Promise<AgentRunResult | null> {
    return this.checkpointPort.get(input);
  }

  async listCheckpoints(input: AgentCheckpointListInput): Promise<AgentRun[]> {
    return this.checkpointPort.list(input);
  }

  async deleteCheckpoint(input: AgentCheckpointDeleteInput): Promise<void> {
    await this.checkpointPort.delete(input);
  }

  async getThreadIndex(identityId: string, agentType?: string): Promise<Record<string, string>> {
    return this.checkpointPort.getThreadIndex(identityId, agentType);
  }
}
