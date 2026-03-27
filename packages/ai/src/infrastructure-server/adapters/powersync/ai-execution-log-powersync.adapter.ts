import { randomUUID } from 'node:crypto';

import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { AIExecutionLogInput, IAIExecutionLogPort } from '../../../application-server/ports';

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

export class AIExecutionLogPowerSyncAdapter implements IAIExecutionLogPort {
  constructor(private readonly db: IElectronDatabase) {}

  async record(input: AIExecutionLogInput): Promise<void> {
    const id = randomUUID();
    const now = new Date().toISOString();

    await this.db.execute(
      `INSERT INTO ai_generation_tasks (
         id, identity_id, task_type, status, input, result, error,
         retry_count, token_usage, processing_ms, version, created_at, updated_at, completed_at, deleted_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        input.identityId,
        input.taskType,
        input.status,
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
}
