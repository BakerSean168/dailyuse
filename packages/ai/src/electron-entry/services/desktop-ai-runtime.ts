/**
 * @deprecated Use `createAIPowerSyncModule()` with `knowledgeNotePersistence` option instead.
 * @deprecated 请使用 `createAIPowerSyncModule()` 并传入 `knowledgeNotePersistence` 选项替代。
 *
 * This class assembled the knowledge-note service for the Electron runtime.
 * The `createAIPowerSyncModule()` composition root now handles this internally.
 *
 * 该类原本为 Electron 运行时组装知识笔记服务。
 * 现在 `createAIPowerSyncModule()` 组合根已在内部处理此逻辑。
 */

import { AIKnowledgeNotePathResolver } from '../../infrastructure-server/services/ai-knowledge-note-path-resolver';
import { ManageAIKnowledgeNoteUseCase } from '../../application-server/use-cases/commands/manage-ai-knowledge-note.use-case';
import type { IKnowledgeNotePersistencePort } from '../../application-server/ports';
import type { IAIProviderConfigRepository } from '../../domain-server/repositories/i-ai-provider-config-repository';
import { DirectProviderKnowledgeNoteGenerationAdapter } from '../../infrastructure-server/chat-execution';

/**
 * @deprecated Use `createAIPowerSyncModule()` with `knowledgeNotePersistence` option instead.
 * @deprecated 请使用 `createAIPowerSyncModule()` 并传入 `knowledgeNotePersistence` 选项替代。
 */
export class DesktopAIRuntime {
  public readonly knowledgeNoteService: ManageAIKnowledgeNoteUseCase;

  constructor(
    providerConfigRepository: IAIProviderConfigRepository,
    persistencePort: IKnowledgeNotePersistencePort,
    getKnowledgeNoteSubpath: (identityId: string) => Promise<string>,
  ) {
    this.knowledgeNoteService = new ManageAIKnowledgeNoteUseCase(
      providerConfigRepository,
      new DirectProviderKnowledgeNoteGenerationAdapter(),
      persistencePort,
      getKnowledgeNoteSubpath,
      new AIKnowledgeNotePathResolver(),
    );
  }
}
