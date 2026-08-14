import type {
  AgentEvent,
  AgentRun,
  AgentRunResult,
  AgentState,
} from '@memoflow/contracts/ai';

/**
 * Agent checkpoint application seam (API / Prisma lane only).
 * Agent checkpoint 应用 seam（仅 API / Prisma lane）。
 *
 * Persists Agent run metadata, state snapshots, pending interrupts and
 * approved actions. The Python Agent runtime reaches this port through the
 * HTTP adapter; the API transport wires its internal checkpoint controllers
 * exclusively from this surface — never from a database adapter.
 *
 * 用于持久化 Agent run metadata、state snapshot、pending interrupt 和
 * approved actions。Python Agent runtime 通过 HTTP adapter 调用此 port；
 * API transport 只从该 surface 接线内部 checkpoint controller，绝不直接
 * 使用数据库适配器。
 */

export interface AgentCheckpointUpsertInput {
  identityId: string;
  run: AgentRun;
  state?: AgentState;
  threadId?: string;
  events?: AgentEvent[];
  interrupts?: Record<string, unknown>[];
  requestId?: string;
}

export interface AgentCheckpointGetInput {
  identityId: string;
  runId: string;
  requestId?: string;
}

export interface AgentCheckpointListInput {
  identityId: string;
  agentType?: string;
  conversationId?: string;
  statuses?: string[];
  activeOnly?: boolean;
  limit?: number;
  requestId?: string;
}

export interface AgentCheckpointDeleteInput {
  identityId: string;
  runId: string;
  requestId?: string;
}

export interface IAgentCheckpointPort {
  /**
   * Saves or updates an Agent run checkpoint.
   * 保存或更新 Agent run checkpoint。
   */
  upsert(input: AgentCheckpointUpsertInput): Promise<void>;

  /**
   * Returns the full checkpoint for a run, or null when absent.
   * 获取指定 run 的完整 checkpoint，不存在时返回 null。
   */
  get(input: AgentCheckpointGetInput): Promise<AgentRunResult | null>;

  /**
   * Lists matching Agent runs.
   * 列出符合条件的 Agent runs。
   */
  list(input: AgentCheckpointListInput): Promise<AgentRun[]>;

  /**
   * Soft-deletes the checkpoint for a run.
   * 软删除指定 run 的 checkpoint。
   */
  delete(input: AgentCheckpointDeleteInput): Promise<void>;

  /**
   * Returns the runId -> threadId mapping.
   * 获取 runId -> threadId 映射。
   */
  getThreadIndex(identityId: string, agentType?: string): Promise<Record<string, string>>;
}
