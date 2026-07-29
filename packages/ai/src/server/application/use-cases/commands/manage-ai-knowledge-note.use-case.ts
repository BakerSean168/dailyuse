import type { Result } from '@memoflow/contracts/result';
import { ok, error } from '@memoflow/contracts/result';
import type { ExecutionContext } from '@memoflow/contracts/shared';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@memoflow/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain/repositories/i-ai-provider-config-repository';
import { createLogger } from '@memoflow/utils/logger';
import type {
  IAIExecutionLogPort,
  IKnowledgeNoteGenerationPort,
  IKnowledgeNotePersistencePort,
} from '../../ports';
import { AIKnowledgeNotePathResolver } from '../../services/ai-knowledge-note-path-resolver';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from './ai-provider-resolution';
import {
  attachRequestIdToError,
  classifyAIExecutionError,
  createAIRequestId,
  withAICostEstimate,
} from './ai-observability';

const logger = createLogger('ManageAIKnowledgeNoteUseCase');

/**
 * Generate a markdown knowledge note through the shared AI execution port and
 * then persist the generated file through the host application's storage port.
 *
 * This keeps the use case focused on orchestration:
 * 1. choose the provider
 * 2. build the prompt
 * 3. ask the execution engine for text
 * 4. save the text
 */
export class ManageAIKnowledgeNoteUseCase {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly knowledgeNoteGenerationPort: IKnowledgeNoteGenerationPort,
    private readonly persistencePort: IKnowledgeNotePersistencePort,
    private readonly pathResolver: AIKnowledgeNotePathResolver,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  async createKnowledgeNote(
    request: CreateKnowledgeNoteReq,
    cx: ExecutionContext,
  ): Promise<Result<CreateKnowledgeNoteRes>> {
    const startedAt = Date.now();
    const requestId = createAIRequestId();
    let providerMetadata: {
      providerId?: string;
      providerName?: string;
      model?: string;
    } = {};

    try {
      const provider = await resolveActiveProviderConfig(
        this.providerConfigRepository,
        cx.identityId,
        request.providerId,
      );
      const executionProviderConfig = toChatExecutionProviderConfig(provider, {
        modelOverride: request.model,
        temperature: 0.4,
      });
      providerMetadata = {
        providerId: provider.id,
        providerName: provider.name,
        model: executionProviderConfig.model,
      };
      const pathInfo = this.pathResolver.resolve(
        request.targetSubpath ?? '',
        request.title ?? request.topic,
      );

      const completion = request.contentMarkdown
        ? {
            content: request.contentMarkdown,
            usage: {
              promptTokens: 0,
              completionTokens: 0,
              totalTokens: 0,
            },
          }
        : await this.knowledgeNoteGenerationPort.generate({
            identityId: cx.identityId,
            providerConfig: executionProviderConfig,
            topic: request.topic,
            title: request.title,
            requestId,
          });

      const persistenceInput = {
        identityId: cx.identityId,
        path: pathInfo.path,
        fileName: pathInfo.fileName,
        content: completion.content,
        proposalId: request.confirmation?.proposalId,
        proposalRevision: request.confirmation?.revision,
        requestId: request.confirmation?.requestId ?? requestId,
        ...(request.connectionId ? { connectionId: request.connectionId } : {}),
      };
      const persisted = await this.persistencePort.createKnowledgeNote(persistenceInput);

      const result: CreateKnowledgeNoteRes = {
        note: persisted.note,
        resolvedPath: pathInfo.path,
        indexStatus: 'pending',
        tokenUsage: completion.usage,
        providerId: provider.id,
        processingTimeMs: Date.now() - startedAt,
        generatedAt: Date.now(),
      };

      await this.recordExecution({
        identityId: cx.identityId,
        taskType: 'KNOWLEDGE_NOTE_GENERATION',
        status: 'COMPLETED',
        requestId,
        ...providerMetadata,
        input: {
          topic: request.topic,
          title: request.title,
          targetSubpath: request.targetSubpath,
          selectedProviderId: request.providerId,
          selectedModel: request.model,
          contentMarkdownLength: request.contentMarkdown?.length,
        },
        result: {
          resolvedPath: result.resolvedPath,
          resourceId: String(result.note.id),
          indexStatus: result.indexStatus,
        },
        tokenUsage: result.tokenUsage,
        processingMs: result.processingTimeMs,
      });

      return ok(result);
    } catch (err) {
      await this.recordExecution({
        identityId: cx.identityId,
        taskType: 'KNOWLEDGE_NOTE_GENERATION',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(err),
        input: {
          topic: request.topic,
          title: request.title,
          targetSubpath: request.targetSubpath,
          selectedProviderId: request.providerId,
          selectedModel: request.model,
          contentMarkdownLength: request.contentMarkdown?.length,
        },
        error: err instanceof Error ? err.message : 'Knowledge note generation failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('Knowledge note generation failed', {
        error: err,
        identityId: cx.identityId,
        requestId,
      });
      const enriched = attachRequestIdToError(err, requestId);
      return error('INTERNAL_ERROR', enriched.message);
    }
  }

  private async recordExecution(
    input: Parameters<NonNullable<IAIExecutionLogPort['record']>>[0],
  ): Promise<void> {
    if (!this.executionLogPort) {
      return;
    }

    try {
      await this.executionLogPort.record(withAICostEstimate(input));
    } catch (err) {
      logger.warn('Failed to record knowledge-note execution log', {
        error: err,
        identityId: input.identityId,
      });
    }
  }
}
