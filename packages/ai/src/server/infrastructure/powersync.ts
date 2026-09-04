/**
 * AI Module — PowerSync persistence ingredients for the Desktop lane.
 *
 * The Desktop host owns runtime composition. This file only selects product
 * persistence adapters; it does not build an Agent runtime or accept legacy
 * AIService/AgentHost capability ports.
 */

import type { IElectronDatabase } from '@memoflow/contracts/electron';
import type {
  IAIExecutionLogPort,
  IAIUsageReadPort,
  IKnowledgeIndexRepository,
  IAIProviderOnboardingCommitPort,
  IAIProviderOnboardingSessionRepository,
} from '../application/ports';
import {
  AIExecutionLogPowerSyncAdapter,
  AIKnowledgeIndexPowerSyncRepository,
  PowerSyncAIConversationRepository,
  PowerSyncAIProviderConfigRepository,
  PowerSyncAIProviderOnboardingCommitAdapter,
  PowerSyncAIProviderOnboardingSessionRepository,
} from './adapters/powersync';
import type { IAIConversationRepository } from '../domain/repositories/i-ai-conversation-repository';
import type { IAIProviderConfigRepository } from '../domain/repositories/i-ai-provider-config-repository';

export interface AIPowerSyncRepositorySet {
  readonly conversationRepository: IAIConversationRepository;
  readonly providerConfigRepository: IAIProviderConfigRepository;
  readonly knowledgeIndexRepository: IKnowledgeIndexRepository;
  readonly executionLogPort: IAIExecutionLogPort & IAIUsageReadPort;
  readonly providerOnboardingSessionRepository: IAIProviderOnboardingSessionRepository;
  readonly providerOnboardingCommitPort: IAIProviderOnboardingCommitPort;
}

export function createAIPowerSyncRepositories(db: IElectronDatabase): AIPowerSyncRepositorySet {
  const providerOnboardingSessionRepository = new PowerSyncAIProviderOnboardingSessionRepository(db);
  return {
    conversationRepository: new PowerSyncAIConversationRepository(db),
    providerConfigRepository: new PowerSyncAIProviderConfigRepository(db),
    knowledgeIndexRepository: new AIKnowledgeIndexPowerSyncRepository(db),
    executionLogPort: new AIExecutionLogPowerSyncAdapter(db),
    providerOnboardingSessionRepository,
    providerOnboardingCommitPort: new PowerSyncAIProviderOnboardingCommitAdapter(db),
  };
}
