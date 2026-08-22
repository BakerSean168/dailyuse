/**
 * Residual 971: withObservabilityPayload sole import
 * (../with-observability-payload.ts).
 */
import { randomUUID } from 'node:crypto';

import type { IElectronDatabase } from '@memoflow/contracts/electron';
import type {
  AIExecutionLogInput,
  AIUsageQuery,
  AIUsageSummary,
  IAIExecutionLogPort,
  IAIUsageReadPort,
} from '../../../application/ports';
import { withObservabilityPayload } from '../with-observability-payload';

type UsageRow = {
  token_usage: string | null;
  estimated_cost_usd: number | null;
};

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

export class AIExecutionLogPowerSyncAdapter implements IAIExecutionLogPort, IAIUsageReadPort {
  constructor(private readonly db: IElectronDatabase) {}

  async record(input: AIExecutionLogInput): Promise<void> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.execute(
      `INSERT INTO ai_generation_tasks (
         id, identity_id, task_type, status, conversation_id, run_id, request_id, trace_id,
         provider_id, model, estimated_cost_usd, input, result, error, retry_count,
         token_usage, processing_ms, version, created_at, updated_at, completed_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.identityId,
        input.taskType,
        input.status,
        input.conversationId ?? null,
        input.runId ?? null,
        input.requestId ?? null,
        input.traceId ?? null,
        input.providerId ?? null,
        input.model ?? null,
        input.costEstimate?.totalCostUsd ?? null,
        JSON.stringify(withObservabilityPayload(input.input, input)),
        input.result ? JSON.stringify(withObservabilityPayload(input.result, input)) : null,
        input.error ?? null,
        0,
        input.tokenUsage ? JSON.stringify(input.tokenUsage) : null,
        input.processingMs ?? null,
        1,
        now,
        now,
        now,
        null,
      ],
    );
  }

  async summarizeUsage(input: AIUsageQuery): Promise<AIUsageSummary> {
    const clauses = ['identity_id = ?', 'deleted_at IS NULL'];
    const parameters: unknown[] = [input.identityId];
    if (input.conversationId) {
      clauses.push('conversation_id = ?');
      parameters.push(input.conversationId);
    }
    if (input.runId) {
      clauses.push('run_id = ?');
      parameters.push(input.runId);
    }
    const rows = await this.db.getAll<UsageRow>(
      `SELECT token_usage, estimated_cost_usd
       FROM ai_generation_tasks
       WHERE ${clauses.join(' AND ')}
       ORDER BY created_at ASC`,
      parameters,
    );

    let promptTokens = 0;
    let completionTokens = 0;
    let totalTokens = 0;
    let estimatedCost = 0;
    let hasCost = false;
    for (const row of rows) {
      const usage = parseTokenUsage(row.token_usage);
      if (usage) {
        promptTokens += usage.promptTokens;
        completionTokens += usage.completionTokens;
        totalTokens += usage.totalTokens;
      }
      const cost = Number(row.estimated_cost_usd);
      if (row.estimated_cost_usd !== null && Number.isFinite(cost)) {
        estimatedCost += cost;
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
