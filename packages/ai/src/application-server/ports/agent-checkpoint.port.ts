import type { AgentRun, AgentRunResult, AgentState } from '@dailyuse/contracts/ai';

/**
 * Agent checkpoint 持久化边界
 *
 * 用于持久化 Agent run metadata、state snapshot、pending interrupt 和 approved actions。
 * Python Agent runtime 通过 HTTP adapter 调用此 port。
 */

export interface AgentCheckpointUpsertInput {
  identityId: string;
  run: AgentRun;
  state?: AgentState;
  threadId?: string;
  requestId?: string;
}

export interface AgentCheckpointGetInput {
  identityId: string;
  runId: string;
  requestId?: string;
}

export interface AgentCheckpointListInput {
  identityId: string;
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
   * 保存或更新 Agent run checkpoint
   */
  upsert(input: AgentCheckpointUpsertInput): Promise<void>;

  /**
   * 获取指定 run 的完整 checkpoint
   */
  get(input: AgentCheckpointGetInput): Promise<AgentRunResult | null>;

  /**
   * 列出符合条件的 Agent runs
   */
  list(input: AgentCheckpointListInput): Promise<AgentRun[]>;

  /**
   * 删除指定 run 的 checkpoint
   */
  delete(input: AgentCheckpointDeleteInput): Promise<void>;

  /**
   * 获取 runId -> threadId 映射
   */
  getThreadIndex(identityId: string): Promise<Record<string, string>>;
}
