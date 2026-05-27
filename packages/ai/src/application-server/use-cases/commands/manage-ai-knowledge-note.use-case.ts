import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ExecutionContext } from '@dailyuse/contracts/shared';
import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@dailyuse/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/i-ai-provider-config-repository';
import { AIKnowledgeNotePathResolver } from '../../../infrastructure-server/services/ai-knowledge-note-path-resolver';
import { createLogger } from '@dailyuse/utils/logger';
import type {
  IAIExecutionLogPort,
  IKnowledgeNoteGenerationPort,
  IKnowledgeNotePersistencePort,
} from '../../ports';
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
    private readonly getKnowledgeNoteSubpath: (identityId: string) => Promise<string>,
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
      const subpath = request.targetSubpath ?? (await this.getKnowledgeNoteSubpath(cx.identityId));
      const pathInfo = this.pathResolver.resolve(subpath, request.title ?? request.topic);

      const completion = await this.knowledgeNoteGenerationPort.generate({
        identityId: cx.identityId,
        providerConfig: executionProviderConfig,
        topic: request.topic,
        title: request.title,
        requestId,
      });

      const persisted = await this.persistencePort.createKnowledgeNote({
        identityId: cx.identityId,
        path: pathInfo.path,
        fileName: pathInfo.fileName,
        content: completion.content,
      });

      const result = {
        resource: persisted.resource,
        resolvedPath: pathInfo.path,
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
        },
        result: {
          resolvedPath: result.resolvedPath,
          resourceId: String(result.resource.id),
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
