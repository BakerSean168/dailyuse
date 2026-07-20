/**
 * Static Port surfaces for the unified Agent Host (ADR-035).
 * 统一 Agent Host 的静态 Port 面（ADR-035）。
 *
 * Stage 0 freezes shapes only. Runtime adapters are wired in later phases.
 * 阶段 0 仅冻结形状；运行时适配在后续阶段接线。
 */

import type { CapabilityOffer, CapabilityRequirement, ResolvedRunPlan } from './capabilities';
import type { AgentProposal, ExecutionReceipt } from './proposal';

export interface ICapabilityResolverPort {
  listOffers(surface: CapabilityOffer['surface']): Promise<CapabilityOffer[]>;
  resolve(requirements: CapabilityRequirement[]): Promise<ResolvedRunPlan>;
}

export interface IProposalKernelPort {
  create(proposal: AgentProposal): Promise<AgentProposal>;
  revise(proposalId: string, next: AgentProposal): Promise<AgentProposal>;
  markStale(proposalId: string, reason: string): Promise<AgentProposal>;
  approve(proposalId: string, revision: number): Promise<AgentProposal>;
  reject(proposalId: string, revision: number, reason?: string): Promise<AgentProposal>;
  executeApproved(proposalId: string, revision: number, requestId: string): Promise<ExecutionReceipt>;
}

/**
 * Turn Engine port — open-ended chat / analysis loops (not durable business workflows).
 * Turn Engine 端口 —— 开放式对话/分析循环（非 durable 业务工作流）。
 */
export interface ITurnEnginePort {
  readonly engineId: string;
  abort(runId: string): Promise<void>;
  /**
   * Start a turn. Streaming events use existing AI event channels; this method
   * returns when the turn reaches a terminal or interrupt state.
   * 启动一个 turn；流式事件复用既有 AI 事件通道，本方法在终态或中断时返回。
   */
  startTurn(input: {
    runId: string;
    identityId: string;
    conversationId?: string;
    message: string;
    signal?: AbortSignal;
  }): Promise<{ status: 'completed' | 'aborted' | 'failed' | 'waiting_approval'; error?: string }>;
}

/**
 * Workflow Adapter port — wraps existing IAgentRuntimePort without replacing Python graphs.
 * Workflow 适配端口 —— 包装既有 IAgentRuntimePort，不替换 Python graph。
 */
export interface IWorkflowAdapterPort {
  readonly adapterId: string;
  /** Capability kinds this adapter can satisfy. */
  offeredKinds: Array<CapabilityOffer['kind']>;
}
