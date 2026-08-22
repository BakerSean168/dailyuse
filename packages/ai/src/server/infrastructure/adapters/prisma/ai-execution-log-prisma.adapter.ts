/**
 * Residual 971: withObservabilityPayload sole import
 * (../with-observability-payload.ts).
 */
import { randomUUID } from 'node:crypto';

import type { PrismaClient } from '@memoflow/database';
import type {
  AIExecutionLogInput,
  AIUsageQuery,
  AIUsageSummary,
  IAIExecutionLogPort,
  IAIUsageReadPort,
} from '../../../application/ports';
import { withObservabilityPayload } from '../with-observability-payload';

function parseTokenUsage(raw: string | null): {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    const promptTokens = Number(value.promptTokens);
    const completionTokens = Number(value.completionTokens);
    const totalTokens = Number(value.totalTokens);
    if (![promptTokens, completionTokens, totalTokens].every(Number.isFinite)) return null;
    return {
      promptTokens: Math.max(0, Math.trunc(promptTokens)),
      completionTokens: Math.max(0, Math.trunc(completionTokens)),
      totalTokens: Math.max(0, Math.trunc(totalTokens)),
    };
  } catch {
    return null;
  }
}

export class AIExecutionLogPrismaAdapter implements IAIExecutionLogPort, IAIUsageReadPort {
  constructor(private readonly prisma: PrismaClient) {}

  async record(input: AIExecutionLogInput): Promise<void> {
    const now = new Date();

    await this.prisma.aiGenerationTask.create({
      data: {
        id: randomUUID(),
        identityId: input.identityId,
        taskType: input.taskType,
        status: input.status,
        conversationId: input.conversationId ?? null,
        runId: input.runId ?? null,
        requestId: input.requestId ?? null,
        traceId: input.traceId ?? null,
        providerId: input.providerId ?? null,
        model: input.model ?? null,
        estimatedCostUsd: input.costEstimate?.totalCostUsd ?? null,
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

  async summarizeUsage(input: AIUsageQuery): Promise<AIUsageSummary> {
    const rows = await this.prisma.aiGenerationTask.findMany({
      where: {
        identityId: input.identityId,
        deletedAt: null,
        ...(input.conversationId ? { conversationId: input.conversationId } : {}),
        ...(input.runId ? { runId: input.runId } : {}),
      },
      select: { tokenUsage: true, estimatedCostUsd: true },
      orderBy: { createdAt: 'asc' },
    });

    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    let estimatedCost = 0;
    let hasCost = false;
    for (const row of rows) {
      const usage = parseTokenUsage(row.tokenUsage);
      if (usage) {
        promptTokens += usage.promptTokens;
        completionTokens += usage.completionTokens;
        totalTokens += usage.totalTokens;
      }
      if (row.estimatedCostUsd !== null && Number.isFinite(row.estimatedCostUsd)) {
        estimatedCost += row.estimatedCostUsd;
        hasCost = true;
      }
    }

    return {
      executionCount: rows.length,
      promptTokens,
      completionTokens,
      totalTokens,
      ...(hasCost ? { estimatedCost } : {}),
    };
  }
}
