import {
  REPOSITORY_RESOURCE_MUTATED_EVENT,
  type RepositoryEventMap,
  type RepositoryResourceMutatedEvent,
} from '@dailyuse/contracts/repository';
import { createTypedEventPublisher, eventBus } from '@dailyuse/utils/domain';

type RepositoryResourceMutationEvents = Pick<
  RepositoryEventMap,
  typeof REPOSITORY_RESOURCE_MUTATED_EVENT
>;

const repositoryEventPublisher =
  createTypedEventPublisher<RepositoryResourceMutationEvents>(eventBus);

export type RepositoryResourceMutationPayload = Omit<RepositoryResourceMutatedEvent, 'timestamp'>;

export function publishRepositoryResourceMutation(
  payload: RepositoryResourceMutationPayload,
): void {
  repositoryEventPublisher.send(REPOSITORY_RESOURCE_MUTATED_EVENT, {
    ...payload,
    timestamp: Date.now(),
  });
}
