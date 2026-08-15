import {
  REPOSITORY_NOTE_MUTATED_EVENT,
  type RepositoryEventMap,
  RepositoryNoteMutationType,
  type RepositoryNoteMutatedEvent,
} from '@memoflow/contracts/repository';
import { createTypedEventSubscriber, eventBus } from '@memoflow/utils/domain';
import { createLogger } from '@memoflow/utils/logger';
import type { IAIProviderConfigRepository } from '../../domain/repositories/i-ai-provider-config-repository';
import { createSystemExecutionContext } from '../../../shared/system-execution-context';

import type { AIModuleRuntimeContribution } from '../ai.module';
import type { AIKnowledgeIndexServices } from '../ai.module';
import {
  resolveActiveProviderConfig,
  toChatExecutionProviderConfig,
} from '../../application/use-cases/commands/ai-provider-resolution';

const logger = createLogger('AIKnowledgeAutoIndexRuntime');
type RepositoryNoteMutationEvents = Pick<RepositoryEventMap, typeof REPOSITORY_NOTE_MUTATED_EVENT>;

const runtimeEventSubscriber = createTypedEventSubscriber<RepositoryNoteMutationEvents>(eventBus);

export function createKnowledgeAutoIndexRuntimeContribution(
  knowledgeIndexServices: AIKnowledgeIndexServices,
  providerConfigRepository: IAIProviderConfigRepository,
): AIModuleRuntimeContribution {
  let started = false;

  const handleNoteMutation = (event: RepositoryNoteMutatedEvent): void => {
    if (event.mutation === RepositoryNoteMutationType.Deleted) {
      void knowledgeIndexServices.removeById
        .execute(event.resourceId, createSystemExecutionContext(event.identityId))
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
        createSystemExecutionContext(event.identityId),
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

      runtimeEventSubscriber.on(REPOSITORY_NOTE_MUTATED_EVENT, handleNoteMutation);
      started = true;
    },
    stop(): void {
      if (!started) {
        return;
      }

      runtimeEventSubscriber.off(REPOSITORY_NOTE_MUTATED_EVENT, handleNoteMutation);
      started = false;
    },
  };
}
