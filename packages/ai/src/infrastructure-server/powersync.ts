/**
 * AI Module — PowerSync Composition Root convenience factory.
 * AI 模块 — PowerSync 组合根便捷工厂。
 *
 * Thin helper that picks PowerSync adapters and delegates to `createAIModule`.
 * 仅选择 PowerSync 适配器后委托给 `createAIModule`。
 *
 * @see {@link createAIModule} for the canonical composition root.
 */

import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IKnowledgeNotePersistencePort } from '../application-server/ports';
import { createAIModule, type AIModuleInstance, type AIModuleDependencies } from './ai.module';
import {
  PowerSyncAIConversationRepository,
  PowerSyncAIProviderConfigRepository,
} from './adapters/powersync';

/**
 * Options for the PowerSync convenience factory.
 * PowerSync 便捷工厂的选项。
 */
export interface AIModulePowerSyncOptions {
  readonly knowledgeNotePersistence?: IKnowledgeNotePersistencePort;
  readonly getKnowledgeNoteSubpath?: (identityId: string) => Promise<string>;
  readonly runtimeContributions?: AIModuleDependencies['runtimeContributions'];
}

/**
 * Creates a fully wired AI module backed by PowerSync repositories.
 * 创建一个完全接线的、使用 PowerSync 仓储的 AI 模块实例。
 */
export function createAIPowerSyncModule(
  db: IElectronDatabase,
  options?: AIModulePowerSyncOptions,
): AIModuleInstance {
  return createAIModule({
    conversationRepository: new PowerSyncAIConversationRepository(db),
    providerConfigRepository: new PowerSyncAIProviderConfigRepository(db),
    knowledgeNotePersistence: options?.knowledgeNotePersistence,
    getKnowledgeNoteSubpath: options?.getKnowledgeNoteSubpath,
    runtimeContributions: options?.runtimeContributions,
  });
}

export { PowerSyncAIConversationRepository, PowerSyncAIProviderConfigRepository };
