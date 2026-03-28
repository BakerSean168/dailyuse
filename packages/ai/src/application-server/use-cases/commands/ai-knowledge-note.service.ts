import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@dailyuse/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import { AIKnowledgeNotePathResolver } from '../../../infrastructure-server/services/ai-knowledge-note-path-resolver';
import { createLogger } from '@dailyuse/utils';
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

const logger = createLogger('AIKnowledgeNoteService');

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
export class AIKnowledgeNoteService {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly knowledgeNoteGenerationPort: IKnowledgeNoteGenerationPort,
    private readonly persistencePort: IKnowledgeNotePersistencePort,
    private readonly getKnowledgeNoteSubpath: (identityId: string) => Promise<string>,
    private readonly pathResolver: AIKnowledgeNotePathResolver,
    private readonly executionLogPort?: IAIExecutionLogPort,
  ) {}

  async createKnowledgeNote(
    identityId: string,
    request: CreateKnowledgeNoteReq,
  ): Promise<CreateKnowledgeNoteRes> {
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
        identityId,
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
      const subpath = request.targetSubpath ?? (await this.getKnowledgeNoteSubpath(identityId));
      const pathInfo = this.pathResolver.resolve(subpath, request.title ?? request.topic);

      const completion = await this.knowledgeNoteGenerationPort.generate({
        identityId,
        providerConfig: executionProviderConfig,
        topic: request.topic,
        title: request.title,
        requestId,
      });

      const persisted = await this.persistencePort.createKnowledgeNote({
        identityId,
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
        identityId,
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

      return result;
    } catch (error) {
      await this.recordExecution({
        identityId,
        taskType: 'KNOWLEDGE_NOTE_GENERATION',
        status: 'FAILED',
        requestId,
        ...providerMetadata,
        errorCategory: classifyAIExecutionError(error),
        input: {
          topic: request.topic,
          title: request.title,
          targetSubpath: request.targetSubpath,
          selectedProviderId: request.providerId,
          selectedModel: request.model,
        },
        error: error instanceof Error ? error.message : 'Knowledge note generation failed',
        processingMs: Date.now() - startedAt,
      });
      logger.error('Knowledge note generation failed', {
        error,
        identityId,
        requestId,
      });
      throw attachRequestIdToError(error, requestId);
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
    } catch (error) {
      logger.warn('Failed to record knowledge-note execution log', {
        error,
        identityId: input.identityId,
      });
    }
  }
}
