import type {
  AIWorkflowResumeClientRequest,
  AIWorkflowRunView,
  AIWorkflowStartClientRequest,
} from '@memoflow/contracts/ai';

/**
 * Stable MemoFlow workflow runtime seam.
 *
 * Mastra workflow implementations stay behind this port so HTTP/IPC transports
 * never depend on framework-private snapshots, run handles, or suspend payloads.
 */
export interface AIWorkflowRuntimePort {
  start(input: {
    identityId: string;
    request: AIWorkflowStartClientRequest;
  }): Promise<AIWorkflowRunView>;
  resume(input: {
    identityId: string;
    request: AIWorkflowResumeClientRequest;
  }): Promise<AIWorkflowRunView>;
  get(input: { identityId: string; runId: string }): Promise<AIWorkflowRunView | null>;
  list(input: {
    identityId: string;
    conversationId?: string;
  }): Promise<readonly AIWorkflowRunView[]>;
  cancel(input: { identityId: string; runId: string }): Promise<AIWorkflowRunView | null>;
}
