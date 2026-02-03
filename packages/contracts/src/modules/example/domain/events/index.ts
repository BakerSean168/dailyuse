/**
 * Example Module - Domain Events
 * 
 * All domain event DTOs for the Example module
 */

import type { ExampleCreatedEvent, ExampleDeletedEvent, ExampleUpdatedEvent, ExampleStatusChangedEvent } from '../..';

export type {ExampleCreatedEvent} from './example-created.event';
export type {ExampleUpdatedEvent} from './example-updated.event';
export type {ExampleDeletedEvent} from './example-deleted.event';
export type {ExampleStatusChangedEvent} from './example-status-changed.event';

export type ExampleDomainEvent =
  | ExampleCreatedEvent
  | ExampleUpdatedEvent
  | ExampleDeletedEvent
    | ExampleStatusChangedEvent;