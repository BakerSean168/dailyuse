/**
 * Example Module - Domain Events
 * 
 * All domain event DTOs for the Example module
 */

import type { ExampleCreatedEvent, ExampleDeletedEvent } from '../..';

export type {ExampleCreatedEvent} from './example-created.event';
export type {ExampleDeletedEvent} from './example-deleted.event';

export type ExampleDomainEvent =
  | ExampleCreatedEvent
  | ExampleDeletedEvent