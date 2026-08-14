/**
 * LangGraph checkpoint application seam (API / Prisma lane only).
 * LangGraph checkpoint 应用 seam（仅 API / Prisma lane）。
 *
 * Persists LangGraph checkpoint tuples, pending writes and thread deletion
 * for the Python Agent runtime. The API transport wires its internal
 * LangGraph checkpoint controller exclusively from this surface — never from
 * a database adapter.
 *
 * 为 Python Agent runtime 持久化 LangGraph checkpoint tuple、pending writes
 * 与 thread 删除。API transport 只从该 surface 接线内部 LangGraph checkpoint
 * controller，绝不直接使用数据库适配器。
 */

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
  /**
   * Stores a checkpoint tuple under (identity, agentType, threadId).
   * 在 (identity, agentType, threadId) 下保存一个 checkpoint tuple。
   */
  putCheckpoint(input: LangGraphCheckpointPutInput): Promise<void>;

  /**
   * Reads a checkpoint tuple (and its pending writes) or null when absent.
   * 读取 checkpoint tuple（含 pending writes），不存在时返回 null。
   */
  getCheckpoint(input: LangGraphCheckpointGetInput): Promise<LangGraphCheckpointTupleRecord | null>;

  /**
   * Lists checkpoint tuples for a thread.
   * 列出某个 thread 的 checkpoint tuple。
   */
  listCheckpoints(input: LangGraphCheckpointListInput): Promise<LangGraphCheckpointTupleRecord[]>;

  /**
   * Appends pending writes to a checkpoint.
   * 向一个 checkpoint 追加 pending writes。
   */
  putWrites(input: LangGraphCheckpointPutWritesInput): Promise<void>;

  /**
   * Deletes a thread's checkpoint and writes.
   * 删除某个 thread 的 checkpoint 与 writes。
   */
  deleteThread(input: LangGraphCheckpointDeleteThreadInput): Promise<void>;
}
