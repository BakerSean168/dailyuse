import {
  REPOSITORY_RESOURCE_MUTATED_EVENT,
  type RepositoryEventMap,
  RepositoryResourceMutationType,
  type RepositoryResourceMutatedEvent,
} from '@dailyuse/contracts/repository';
import { createTypedEventSubscriber, eventBus } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import type { IAIProviderConfigRepository } from '../../domain/repositories/i-ai-provider-config-repository';

import type { AIModuleRuntimeContribution } from '../ai.module';
import type { AIKnowledgeIndexServices } from '../ai.module';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from '../../application/use-cases/commands/ai-provider-resolution';

const logger = createLogger('AIKnowledgeAutoIndexRuntime');
type RepositoryResourceMutationEvents = Pick<
  RepositoryEventMap,
  typeof REPOSITORY_RESOURCE_MUTATED_EVENT
>;

const runtimeEventSubscriber =
  createTypedEventSubscriber<RepositoryResourceMutationEvents>(eventBus);

export function createKnowledgeAutoIndexRuntimeContribution(
  knowledgeIndexServices: AIKnowledgeIndexServices,
  providerConfigRepository: IAIProviderConfigRepository,
): AIModuleRuntimeContribution {
  let started = false;

  const handleResourceMutation = (event: RepositoryResourceMutatedEvent): void => {
    if (event.mutation === RepositoryResourceMutationType.Deleted) {
      void knowledgeIndexServices.removeById
        .execute(event.resourceId, { identityId: event.identityId })
        .catch((error) => {
          logger.warn('Automatic knowledge index deletion failed after repository mutation', {
            error,
            identityId: event.identityId,
            resourceId: event.resourceId,
          });
        });
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

      await knowledgeIndexServices.syncById.execute(
        event.resourceId,
        { identityId: event.identityId },
        {
          force: true,
          providerConfig,
        },
      );
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

      runtimeEventSubscriber.on(REPOSITORY_RESOURCE_MUTATED_EVENT, handleResourceMutation);
      started = true;
    },
    stop(): void {
      if (!started) {
        return;
      }

      runtimeEventSubscriber.off(REPOSITORY_RESOURCE_MUTATED_EVENT, handleResourceMutation);
      started = false;
    },
  };
}
