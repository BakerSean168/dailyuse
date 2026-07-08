import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@dailyuse/database';
import type { AIExecutionLogInput, IAIExecutionLogPort } from '../../../application/ports';

function withObservabilityPayload(
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

export class AIExecutionLogPrismaAdapter implements IAIExecutionLogPort {
  constructor(private readonly prisma: PrismaClient) {}

  async record(input: AIExecutionLogInput): Promise<void> {
    const now = new Date();

    await this.prisma.aiGenerationTask.create({
      data: {
        id: randomUUID(),
        identityId: input.identityId,
        taskType: input.taskType,
        status: input.status,
        input: JSON.stringify(withObservabilityPayload(input.input, input)),
        result: input.result ? JSON.stringify(withObservabilityPayload(input.result, input)) : null,
        error: input.error ?? null,
        retryCount: 0,
        tokenUsage: input.tokenUsage ? JSON.stringify(input.tokenUsage) : null,
        processingMs: input.processingMs ?? null,
        completedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
  }
}
