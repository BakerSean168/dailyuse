import { AIModel, AIProvider, type AIGenerationTaskServerDTO } from '@dailyuse/contracts/ai';

export class AiGenerationTaskSqliteMapper {
  static toDTO(row: any): AIGenerationTaskServerDTO {
    const parsedInput = row.input_data ? this.parseJson<any>(row.input_data, {}) : {};
    const inputData = parsedInput?.data ?? parsedInput ?? {};
    const inputMeta = parsedInput?.meta ?? {};
    const completedAt = row.completed_at ?? null;
    const processingStartedAt =
      typeof inputMeta.processingStartedAt === 'number'
        ? inputMeta.processingStartedAt
        : completedAt != null && typeof row.processing_ms === 'number'
          ? completedAt - row.processing_ms
          : null;

    return {
      id: row.id,
      identityId: row.identity_id,
      conversationId: inputMeta.conversationId ?? null,
      type: row.task_type,
      status: row.status,
      provider: inputMeta.provider ?? AIProvider.OpenAI,
      model: inputMeta.model ?? AIModel.Gpt4Turbo,
      input: inputData,
      result: this.parseJson(row.output_data, null),
      tokenUsage: this.parseJson(row.token_usage, null),
      errorMessage: row.error_message ?? null,
      retryCount: row.retry_count ?? 0,
      maxRetries: inputMeta.maxRetries ?? 3,
      processingStartedAt,
      processingCompletedAt: completedAt,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static parseJson<T>(value: string | null, fallback: T): T {
    if (!value) {
      return fallback;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
}
