/**
 * Residual 965: sole getRequestId helper for AI API agent/checkpoint routes.
 * agent-checkpoint / agent-runtime / langgraph-checkpoint routes import this;
 * local duals retired.
 * Prefer req.traceId, fall back to req.id.
 */

export function getRequestId(req: { traceId?: string; id?: string }): string | undefined {
  return req.traceId ?? req.id;
}
