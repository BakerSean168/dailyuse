/**
 * Residual 1031: goal event-pattern dual retired onto patterns/events sole.
 * Re-export only — no local createEventBusAdapter dual body.
 */
export {
  createEventBusAdapter,
  type EventHandler,
  type IEventEmitter,
  type IEventBus,
  type IEventSender,
  type IPersistenceMapper,
} from '../events';
export type { IDomainEvent } from '../events';
