import type {
  ILangGraphCheckpointPort,
  LangGraphCheckpointDeleteThreadInput,
  LangGraphCheckpointGetInput,
  LangGraphCheckpointListInput,
  LangGraphCheckpointPutInput,
  LangGraphCheckpointPutWritesInput,
  LangGraphCheckpointTupleRecord,
} from '../application-server/ports';

export class AILangGraphCheckpointController {
  constructor(private readonly checkpointPort: ILangGraphCheckpointPort) {}

  async putCheckpoint(input: LangGraphCheckpointPutInput): Promise<void> {
    await this.checkpointPort.putCheckpoint(input);
  }

  async getCheckpoint(
    input: LangGraphCheckpointGetInput,
  ): Promise<LangGraphCheckpointTupleRecord | null> {
    return this.checkpointPort.getCheckpoint(input);
  }

  async listCheckpoints(
    input: LangGraphCheckpointListInput,
  ): Promise<LangGraphCheckpointTupleRecord[]> {
    return this.checkpointPort.listCheckpoints(input);
  }

  async putWrites(input: LangGraphCheckpointPutWritesInput): Promise<void> {
    await this.checkpointPort.putWrites(input);
  }

  async deleteThread(input: LangGraphCheckpointDeleteThreadInput): Promise<void> {
    await this.checkpointPort.deleteThread(input);
  }
}
