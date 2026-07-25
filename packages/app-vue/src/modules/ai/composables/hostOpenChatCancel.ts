/**
 * Residual 393: Host open-chat stop → cancel_run helpers.
 *
 * Client abort alone does not stop server Turn Engines. Open chat assigns a
 * client-owned runId and stopGenerating dispatches cancel_run so DirectTurn /
 * ReadonlyAnalysis engines abort. Never puts server identity on the client command body.
 */

/** Build a client-owned Host run id for open chat before stream starts. */
export function createHostOpenChatRunId(
  now: () => number = () => Date.now(),
  random: () => number = () => Math.random(),
): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `open-chat:${crypto.randomUUID()}`;
  }
  return `open-chat:${now()}-${Math.floor(random() * 1e9).toString(36)}`;
}

/**
 * Build cancel_run command for an active Host open-chat run.
 * Returns null when there is no tracked run (idle / already cleared).
 * Client cancel body carries only runId.
 */
export function buildHostOpenChatStopCancelCommand(
  activeRunId: string | null | undefined,
): { type: 'cancel_run'; runId: string } | null {
  const runId = typeof activeRunId === 'string' ? activeRunId.trim() : '';
  if (!runId) return null;
  return { type: 'cancel_run', runId };
}

/** Whether a Host event indicates the open-chat turn was cancelled/aborted. */
export function isHostOpenChatCancelledEvent(event: {
  type: string;
  status?: string;
}): boolean {
  if (event.type === 'run.cancelled') return true;
  if (event.type === 'message.completed' && event.status === 'aborted') return true;
  return false;
}
