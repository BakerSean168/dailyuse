import {
  REPOSITORY_RESOURCE_MUTATED_EVENT,
  RepositoryResourceMutationType,
  type RepositoryResourceMutatedEvent,
} from '@dailyuse/contracts/repository';
import { createLogger, eventBus } from '@dailyuse/utils';
import type { IAIProviderConfigRepository } from '../../domain-server/repositories/IAIProviderConfigRepository';

import type { AIModuleRuntimeContribution } from '../ai.module';
import { AIKnowledgeIndexService } from '../../application-server/use-cases';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from '../../application-server/use-cases/commands/ai-provider-resolution';

const logger = createLogger('AIKnowledgeAutoIndexRuntime');
const runtimeEventBus = eventBus as unknown as {
  on(eventType: string, handler: (payload: unknown) => void): void;
  off(eventType: string, handler?: (payload: unknown) => void): void;
};

export function createKnowledgeAutoIndexRuntimeContribution(
  knowledgeIndexService: AIKnowledgeIndexService,
  providerConfigRepository: IAIProviderConfigRepository,
): AIModuleRuntimeContribution {
  let started = false;

  const handleResourceMutation = (payload: unknown): void => {
    const event = parseRepositoryResourceMutation(payload);
    if (!event) {
      return;
    }

    if (event.mutation === RepositoryResourceMutationType.Deleted) {
      return;
    }

    void (async () => {
      let providerConfig;
      try {
        const provider = await resolveActiveProviderConfig(
          providerConfigRepository,
          event.identityId,
        );
        providerConfig = toChatExecutionProviderConfig(provider, {
          temperature: 0.2,
        });
      } catch {
        providerConfig = undefined;
      }

      await knowledgeIndexService.syncResourceById(event.identityId, event.resourceId, {
        force: true,
        providerConfig,
      });
    })().catch((error) => {
        logger.warn('Automatic knowledge reindex failed after repository mutation', {
          error,
          identityId: event.identityId,
          resourceId: event.resourceId,
          mutation: event.mutation,
        });
      });
  };

  return {
    start(): void {
      if (started) {
        return;
      }

      runtimeEventBus.on(REPOSITORY_RESOURCE_MUTATED_EVENT, handleResourceMutation);
      started = true;
    },
    stop(): void {
      if (!started) {
        return;
      }

      runtimeEventBus.off(REPOSITORY_RESOURCE_MUTATED_EVENT, handleResourceMutation);
      started = false;
    },
  };
}

function parseRepositoryResourceMutation(payload: unknown): RepositoryResourceMutatedEvent | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const event = payload as Record<string, unknown>;
  if (
    typeof event.identityId !== 'string' ||
    typeof event.repositoryId !== 'string' ||
    typeof event.resourceId !== 'string' ||
    typeof event.resourcePath !== 'string' ||
    typeof event.timestamp !== 'number'
  ) {
    return null;
  }

  if (
    event.mutation !== RepositoryResourceMutationType.Created &&
    event.mutation !== RepositoryResourceMutationType.ContentUpdated &&
    event.mutation !== RepositoryResourceMutationType.Moved &&
    event.mutation !== RepositoryResourceMutationType.Deleted
  ) {
    return null;
  }

  return {
    identityId: event.identityId,
    repositoryId: event.repositoryId,
    resourceId: event.resourceId,
    resourcePath: event.resourcePath,
    mutation: event.mutation,
    timestamp: event.timestamp,
  };
}
