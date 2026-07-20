/**
 * Agent Host capability model (ADR-035 stage 0).
 * Agent Host 能力模型（ADR-035 阶段 0）。
 *
 * Static supportsXxx flags remain for compatibility; new code should prefer
 * CapabilityOffer / CapabilityRequirement projections.
 * 旧 supportsXxx 兼容保留；新代码优先使用 Capability 投影。
 */

export type AgentCapabilityKind =
  | 'chat.complete'
  | 'chat.stream'
  | 'workflow.goal'
  | 'workflow.research'
  | 'tool.query'
  | 'tool.proposal'
  | 'tool.mutation'
  | 'context.local_vault'
  | 'context.cloud_rag'
  | 'engine.direct_turn'
  | 'engine.langgraph_workflow'
  | 'engine.pi_readonly'
  | 'engine.cli_readonly';

export interface CapabilityOffer {
  kind: AgentCapabilityKind;
  /** Implementation id for diagnostics, never shown as product mode. */
  providerId: string;
  /** Surface where this capability is available. */
  surface: 'web' | 'desktop' | 'server' | 'any';
  readonly: boolean;
  /** Human-readable constraint notes for UI/debug. */
  constraints?: string[];
}

export interface CapabilityRequirement {
  kind: AgentCapabilityKind;
  optional?: boolean;
  readonly?: boolean;
}

/**
 * Resolved plan for a single assistant turn / workflow run.
 * 单次助手回合 / workflow run 的解析计划。
 */
export interface ResolvedRunPlan {
  engineId: string;
  offers: CapabilityOffer[];
  /** Missing required capabilities; empty means runnable. */
  missing: CapabilityRequirement[];
}
