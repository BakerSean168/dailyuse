export interface SerializedLangGraphValue {
  type: string;
  data: string;
}

export interface LangGraphCheckpointRecord {
  identityId: string;
  agentType: string;
  threadId: string;
  checkpointNs: string;
  checkpointId: string;
  parentCheckpointId?: string | null;
  checkpoint: SerializedLangGraphValue;
  metadata: SerializedLangGraphValue;
  createdAt: string;
}

export interface LangGraphCheckpointWriteRecord {
  taskId: string;
  taskPath: string;
  idx: number;
  channel: string;
  value: SerializedLangGraphValue;
  createdAt: string;
}

export interface LangGraphCheckpointTupleRecord extends LangGraphCheckpointRecord {
  pendingWrites: LangGraphCheckpointWriteRecord[];
}

export interface LangGraphCheckpointPutInput {
  identityId: string;
  agentType: string;
  threadId: string;
  checkpointNs?: string;
  checkpointId: string;
  parentCheckpointId?: string | null;
  checkpoint: SerializedLangGraphValue;
  metadata: SerializedLangGraphValue;
  requestId?: string;
}

export interface LangGraphCheckpointGetInput {
  identityId: string;
  agentType: string;
  threadId: string;
  checkpointNs?: string;
  checkpointId?: string;
  requestId?: string;
}

export interface LangGraphCheckpointListInput {
  identityId: string;
  agentType: string;
  threadId: string;
  checkpointNs?: string;
  beforeCheckpointId?: string;
  limit?: number;
  requestId?: string;
}

export interface LangGraphCheckpointPutWritesInput {
  identityId: string;
  agentType: string;
  threadId: string;
  checkpointNs?: string;
  checkpointId: string;
  taskId: string;
  taskPath?: string;
  writes: Array<{
    idx: number;
    channel: string;
    value: SerializedLangGraphValue;
  }>;
  requestId?: string;
}

export interface LangGraphCheckpointDeleteThreadInput {
  identityId: string;
  agentType: string;
  threadId: string;
  checkpointNs?: string;
  requestId?: string;
}

export interface ILangGraphCheckpointPort {
  putCheckpoint(input: LangGraphCheckpointPutInput): Promise<void>;
  getCheckpoint(input: LangGraphCheckpointGetInput): Promise<LangGraphCheckpointTupleRecord | null>;
  listCheckpoints(input: LangGraphCheckpointListInput): Promise<LangGraphCheckpointTupleRecord[]>;
  putWrites(input: LangGraphCheckpointPutWritesInput): Promise<void>;
  deleteThread(input: LangGraphCheckpointDeleteThreadInput): Promise<void>;
}
