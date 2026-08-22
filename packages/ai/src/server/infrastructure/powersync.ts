/**
 * AI Module — PowerSync persistence ingredients for the Desktop lane.
 *
 * The Desktop host owns runtime composition. This file only selects product
 * persistence adapters; it does not build an Agent runtime or accept legacy
 * AIService/AgentHost capability ports.
 */

import type { IElectronDatabase } from '@memoflow/contracts/electron';
import type { IAIExecutionLogPort, IAIUsageReadPort, IKnowledgeIndexRepository } from '../application/ports';
import {
  AIExecutionLogPowerSyncAdapter,
  AIKnowledgeIndexPowerSyncRepository,
  PowerSyncAIConversationRepository,
  PowerSyncAIProviderConfigRepository,
} from './adapters/powersync';
import type { IAIConversationRepository } from '../domain/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../domain/repositories/i-ai-provider-config-repository';

export interface AIPowerSyncRepositorySet {
  readonly conversationRepository: IAIConversationRepository;
  readonly providerConfigRepository: IAIProviderConfigRepository;
  readonly knowledgeIndexRepository: IKnowledgeIndexRepository;
  readonly executionLogPort: IAIExecutionLogPort & IAIUsageReadPort;
}

export function createAIPowerSyncRepositories(db: IElectronDatabase): AIPowerSyncRepositorySet {
  return {
    conversationRepository: new PowerSyncAIConversationRepository(db),
    providerConfigRepository: new PowerSyncAIProviderConfigRepository(db),
    knowledgeIndexRepository: new AIKnowledgeIndexPowerSyncRepository(db),
    executionLogPort: new AIExecutionLogPowerSyncAdapter(db),
  };
}
