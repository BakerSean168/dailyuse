/**
 * Residual 971: withObservabilityPayload sole import
 * (../with-observability-payload.ts).
 */
import { randomUUID } from 'node:crypto';

import type { IElectronDatabase } from '@memoflow/contracts/electron';
import type { AIExecutionLogInput, IAIExecutionLogPort } from '../../../application/ports';
import { withObservabilityPayload } from '../with-observability-payload';


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
