/**
 * LangGraphWorkflowAdapter — first production Workflow Adapter (ADR-035 stage 3 / residual 318).
 *
 * Wraps existing IAgentRuntimePort without replacing Python LangGraph graphs.
 * Declares workflow/engine capability kinds only — never claims tool.proposal /
 * tool.mutation / context.* as satisfied by the workflow engine alone.
 */
import type { CapabilityOffer, IWorkflowAdapterPort } from '@memoflow/contracts/ai';
import type {
  AgentEvent,
  AgentRun,
  AgentRunResult,
} from '@memoflow/contracts/ai';
import type {
  AgentRuntimeListInput,
  AgentRuntimeResumeInput,
  AgentRuntimeRunInput,
  AgentRuntimeStartInput,
  IAgentRuntimePort,
} from '../../application/ports';

export const LANGGRAPH_WORKFLOW_ADAPTER_ID = 'workflow.langgraph' as const;

const OFFERED_KINDS = [
  'workflow.goal',
  'workflow.research',
  'engine.langgraph_workflow',
] as const satisfies ReadonlyArray<CapabilityOffer['kind']>;

export class LangGraphWorkflowAdapter implements IWorkflowAdapterPort, IAgentRuntimePort {
  readonly adapterId = LANGGRAPH_WORKFLOW_ADAPTER_ID;
  readonly offeredKinds: Array<CapabilityOffer['kind']> = [...OFFERED_KINDS];

  constructor(private readonly inner: IAgentRuntimePort) {}

  /**
   * Capability offers declared by this adapter. Engine/workflow labels only —
   * callers must still supply proposal/mutation/context offers separately.
   */
  toCapabilityOffers(surface: CapabilityOffer['surface'] = 'any'): CapabilityOffer[] {
    return this.offeredKinds.map((kind) => ({
      kind,
      providerId: this.adapterId,
      surface,
      // engine.* labels are readonly diagnostics; workflow kinds are not mutations.
      readonly: kind.startsWith('engine.'),
    }));
  }

  /** Structural guard: workflow offers never include host mutation/proposal tools. */
  assertsNoMutationOffers(): void {
    for (const kind of this.offeredKinds) {
      if (kind === 'tool.mutation' || kind === 'tool.proposal') {
        throw new Error(`LangGraphWorkflowAdapter must not offer ${kind}`);
      }
    }
  }

  startRun(input: AgentRuntimeStartInput): Promise<AgentRunResult> {
    return this.inner.startRun(input);
  }

  resumeRun(input: AgentRuntimeResumeInput): Promise<AgentRunResult> {
    return this.inner.resumeRun(input);
  }

  listRuns(input: AgentRuntimeListInput): Promise<AgentRun[]> {
    return this.inner.listRuns(input);
  }

  getRun(input: AgentRuntimeRunInput): Promise<AgentRunResult> {
    return this.inner.getRun(input);
  }

  getEvents(input: AgentRuntimeRunInput): Promise<AgentEvent[]> {
    return this.inner.getEvents(input);
  }
}
