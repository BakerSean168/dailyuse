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

function offerMatchesSurface(
  offer: CapabilityOffer,
  surface?: CapabilityOffer['surface'],
): boolean {
  if (!surface) {
    return true;
  }
  return offer.surface === 'any' || offer.surface === surface;
}

function offerSatisfiesRequirement(
  offer: CapabilityOffer,
  requirement: CapabilityRequirement,
): boolean {
  if (offer.kind !== requirement.kind) {
    return false;
  }
  // A readonly requirement may be satisfied by a writable offer; a writable
  // requirement must not be satisfied by a readonly-only offer.
  if (requirement.readonly === false && offer.readonly) {
    return false;
  }
  return true;
}

/**
 * Resolve offers against requirements without silent capability expansion.
 * Fail closed: missing required kinds stay in `missing` and engineId becomes `none`.
 */
export function resolveRunPlan(input: {
  engineId: string;
  offers: readonly CapabilityOffer[];
  requirements: readonly CapabilityRequirement[];
  surface?: CapabilityOffer['surface'];
}): ResolvedRunPlan {
  const offers = input.offers.filter((offer) => offerMatchesSurface(offer, input.surface));
  const missing: CapabilityRequirement[] = [];

  for (const requirement of input.requirements) {
    const satisfied = offers.some((offer) => offerSatisfiesRequirement(offer, requirement));
    if (!satisfied && !requirement.optional) {
      missing.push(requirement);
    }
  }

  return {
    engineId: missing.length > 0 ? 'none' : input.engineId,
    offers: [...offers],
    missing,
  };
}

/**
 * First-phase knowledge write requirements differ by surface:
 * Desktop needs local vault context; Web needs cloud projection/RAG context.
 * Both require proposal + mutation tool capabilities.
 */
export function knowledgeWriteRequirements(
  surface: 'web' | 'desktop',
): CapabilityRequirement[] {
  return [
    { kind: 'tool.proposal', optional: false },
    { kind: 'tool.mutation', optional: false, readonly: false },
    surface === 'desktop'
      ? { kind: 'context.local_vault', optional: false }
      : { kind: 'context.cloud_rag', optional: false },
  ];
}

/**
 * First-phase goal automation requires proposal + writable mutation + goal workflow.
 * 首期目标自动化需要 proposal、可写 mutation 与 goal workflow 能力。
 */
export function goalAutomationRequirements(): CapabilityRequirement[] {
  return [
    { kind: 'tool.proposal', optional: false },
    { kind: 'tool.mutation', optional: false, readonly: false },
    { kind: 'workflow.goal', optional: false },
  ];
}

