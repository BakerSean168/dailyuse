import type { CreateKnowledgeNoteReq, CreateKnowledgeNoteRes } from '@dailyuse/contracts/ai';
import type { IAIProviderConfigRepository } from '../../../domain-server/repositories/IAIProviderConfigRepository';
import { OpenAICompatibleGateway } from '../../../infrastructure-server/gateways/openai-compatible.gateway';
import { DefaultRepositoryResolver } from '../../../infrastructure-server/services/default-repository-resolver';
import { AIKnowledgeNotePathResolver } from '../../../infrastructure-server/services/ai-knowledge-note-path-resolver';
import type { RepositoryResourceWriter } from '../../../infrastructure-server/services/repository-resource-writer';

export class AIKnowledgeNoteService {
  constructor(
    private readonly providerConfigRepository: IAIProviderConfigRepository,
    private readonly gateway: OpenAICompatibleGateway,
    private readonly repositoryResolver: DefaultRepositoryResolver,
    private readonly resourceWriter: RepositoryResourceWriter,
    private readonly getKnowledgeNoteSubpath: (identityId: string) => Promise<string>,
    private readonly pathResolver: AIKnowledgeNotePathResolver,
  ) {}

  async createKnowledgeNote(
    identityId: string,
    request: CreateKnowledgeNoteReq,
  ): Promise<CreateKnowledgeNoteRes> {
    const startedAt = Date.now();
    const provider = await this.resolveProvider(identityId, request.providerId);
    const repository = await this.repositoryResolver.resolve(identityId);
    const subpath = request.targetSubpath ?? (await this.getKnowledgeNoteSubpath(identityId));
    const pathInfo = this.pathResolver.resolve(subpath, request.title ?? request.topic);

    const completion = await this.gateway.complete({
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey,
      model: provider.defaultModel ?? 'gpt-4o-mini',
      responseFormat: 'text',
      messages: [
        {
          role: 'system',
          content:
            'You write concise, structured Markdown knowledge notes with a title, short intro, section headings, and a closing summary.',
        },
        {
          role: 'user',
          content: `Create a Markdown knowledge note about: ${request.topic}`,
        },
      ],
    });

    const resource = await this.resourceWriter.createMarkdownNote({
      repositoryId: String(repository.id),
      identityId,
      fileName: pathInfo.fileName,
      path: pathInfo.path,
      content: completion.content,
    });

    return {
      resource: resource.resource,
      resolvedPath: pathInfo.path,
      tokenUsage: completion.usage,
      providerId: provider.id,
      processingTimeMs: Date.now() - startedAt,
      generatedAt: Date.now(),
    };
  }

  private async resolveProvider(identityId: string, providerId?: string) {
    if (providerId) {
      const provider = await this.providerConfigRepository.findById(providerId);
      if (provider?.isActive) {
        return provider;
      }
    }

    const defaultProvider = await this.providerConfigRepository.findDefaultByIdentityId(identityId);
    if (defaultProvider?.isActive) {
      return defaultProvider;
    }

    const providers = await this.providerConfigRepository.findByIdentityId(identityId);
    const provider = providers.find((item) => item.isActive);
    if (!provider) {
      throw new Error('No AI provider configured');
    }

    return provider;
  }
}
