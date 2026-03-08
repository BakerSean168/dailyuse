import { OpenAICompatibleGateway } from '../../infrastructure-server/gateways/openai-compatible.gateway';
import { AIKnowledgeNotePathResolver } from '../../infrastructure-server/services/ai-knowledge-note-path-resolver';
import { AIKnowledgeNoteService } from '../../application-server/use-cases/commands/ai-knowledge-note.service';
import type { IKnowledgeNotePersistencePort } from '../../application-server/ports';
import type { IAIProviderConfigRepository } from '../../domain-server/repositories/IAIProviderConfigRepository';

export class DesktopAIRuntime {
  public readonly knowledgeNoteService: AIKnowledgeNoteService;

  constructor(
    providerConfigRepository: IAIProviderConfigRepository,
    persistencePort: IKnowledgeNotePersistencePort,
    getKnowledgeNoteSubpath: (identityId: string) => Promise<string>,
  ) {
    this.knowledgeNoteService = new AIKnowledgeNoteService(
      providerConfigRepository,
      new OpenAICompatibleGateway(),
      persistencePort,
      getKnowledgeNoteSubpath,
      new AIKnowledgeNotePathResolver(),
    );
  }
}
