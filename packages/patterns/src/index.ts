/**
 * @memoflow/patterns — Cross-cutting domain patterns
 *
 * Root export only exposes stable, widely-used patterns.
 * Use subpath imports for specific pattern families:
 * - `@memoflow/patterns/scheduler` — priority queue, timer, monitor
 * - `@memoflow/patterns/repository` — aggregate repository base
 * - `@memoflow/patterns/events` — event bus adapter, event interfaces
 */

// ── Repository patterns (most widely used) ──
export {
  AggregateRepositoryBase,
  publishAggregateEvents,
  type IAggregateRepository,
} from './repository/aggregate-repository.base';
export type { IRepository, IQuery } from './repository';

// ── Event patterns ──
export { createEventBusAdapter } from './events';
export type { IEventBus, IEventSender, EventHandler, IEventEmitter } from './events';

// ── Business metrics (R0-3) ──
export { createBusinessMetricRecorder } from './observability';
export type {
  BusinessMetricKey,
  BusinessMetricRecorder,
  CounterMetricKey,
  GaugeMetricKey,
} from './observability';

// ── Outbox patterns (R1-2 durable side-effect fallback) ──
export type { IOutboxWriter, OutboxEnqueueInput } from './outbox';
