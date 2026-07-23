/**
 * Residual 971: sole withObservabilityPayload helper for AI execution-log adapters.
 * PowerSync + Prisma execution-log adapters import this; local duals retired.
 * Merges defined observability fields onto the stored payload under __observability.
 */

import type { AIExecutionLogInput } from '../../application/ports';

export function withObservabilityPayload(
  payload: Record<string, unknown>,
  input: AIExecutionLogInput,
): Record<string, unknown> {
  const observability = {
    requestId: input.requestId,
    providerId: input.providerId,
    providerName: input.providerName,
    model: input.model,
    errorCategory: input.errorCategory,
    costEstimate: input.costEstimate,
  };
  const definedEntries = Object.entries(observability).filter(([, value]) => value !== undefined);

  if (definedEntries.length === 0) {
    return payload;
  }

  return {
    ...payload,
    __observability: Object.fromEntries(definedEntries),
  };
}
