# ROUTINE-3401 — Routine Wall-Clock Scheduled Handler Lane

## Status

Active implementation (Wave 3 closure). Tracked by `docs/plan/active/2026-08-26-core-vnext-orchestration.md`
ROUTINE-3401 (line ~1204) / ROUTINE-3402 (line ~1225, shadow compare = later phase).

## Objective

Project each Routine's next **canonical durable wall-clock occurrence** (IANA timezone) as a
one-shot `ScheduledIntent`; execute it through a **registered** `ScheduledHandler` plus the
existing `ReminderOccurrence`-style occurrence fence (lease / idempotency / fencing /
same-transaction commit); durably enqueue a `notification.requested` outbox message; publish a
post-commit event so the projection runtime reconciles the **next** one-shot.

Surfaces satisfied:

- Fixture F: Routine 23:30 wall-clock + snooze → next eligible durable invocation without duplication.
- Only the Scheduler provides durable wake-up (Elapsed/ActiveUsage stay `local-runtime`).
- Occurrence fence preserves ReminderOccurrence idempotency / fencing / next-trigger correctness;
  a crash/retry replay never emits a duplicate notification.

## Existing assets (reused, not rewritten)

- `packages/reminder/src/server/domain/routine/trigger.ts` — `WallClockTrigger` (`timingOwner:'scheduler'`),
  `requiresDurableScheduleProjection`, `nextWallClockOccurrence`, `RoutineTemporaryOverride`
  (`snoozeUntil`/`suppressUntil`), `temporaryOverrideAllowsExecution`.
- `packages/time/src/recurrence/recurrence-engine.port.ts` — `RecurrenceEnginePort.next` (IANA).
- `packages/contracts/schedule` — `SchedulingOwner`, `ScheduledIntent`, `buildSchedulingKey`,
  `ScheduledHandlerRegistration` / `ScheduledInvocationContext` (through `@memoflow/schedule`).
- `packages/schedule-orchestration` — `ScheduledHandlerRegistry`, module seam, runtime contribution
  pattern (goal-projection-runtime), `createHandlerRegistryScheduleTaskSourceExecutor`.
- `@memoflow/utils/domain` — shared `eventBus`, `createTypedEventPublisher`/`createTypedEventSubscriber`.

## New surfaces

### `packages/reminder` (Routine lane owns projection + execution truth)

- `server/domain/routine/next-eligible-occurrence.ts`
  - `computeRoutineNextEligibleOccurrence({ engine, trigger, after, temporaryOverride })` →
    `{ occurrenceAt, occurrenceKey } | null`.
  - Walks `engine.next(...)` skipping candidates inside an active snooze/suppress window
    (expired overrides are neutral per `temporaryOverrideAllowsExecution`).
- `server/infrastructure/routine-schedule/routine-schedule-contract.ts`
  - `ROUTINE_WALLCLOCK_HANDLER_KEY = 'routine.wallclock.fire'`, payload version 1.
  - `RoutineWallClockOccurrencePayload` + `buildRoutineWallClockPayload`/`parseRoutineWallClockPayload`.
  - occurrence key `` `routine:${routineId}:oc:${occurrenceAtMs}` `` (canonical; one per instant),
    scheduling key `buildSchedulingKey('routine.wallclock', routineId, occurrenceKey)`,
    owner type `'routine.routine'`.
- `server/infrastructure/routine-schedule/routine-schedule-projection-source.ts`
  - `RoutineScheduleProjectionSource` interface: `buildRoutineOwner`, `buildRoutinePlan`,
    `listRoutineRefs?`.
  - `createRoutineScheduleProjectionSource({ reader, recurrenceEngine, now? })` — reader supplies
    `{ definition, temporaryOverride }` (definition from W2 domain model; snooze = runtime state
    injected in tests, production default null until W4).
  - Gates: `definition.enabled`, scheduler-owned trigger, occurrence strictly after `now`.
  - `createRoutineScheduleProjectionEventHandlers(projector)`: `routine:occurrence-committed` →
    re-project that routine (post-commit next one-shot).
- `server/domain/ports/routine-occurrence-store.port.ts`, `routine-notification-writer.port.ts`
  - Durable occurrence row with lease/fencing/idempotency (mirrors ReminderReliableOperation).
  - Notification writer writes `notification.requested` with idempotency key derived from
    `occurrenceKey`.
- `server/infrastructure/routine-schedule/routine-schedule-execution-source.ts`
  - `RoutineScheduleExecutionSource.executeRoutineOccurrence(input)`.
  - Transaction shape (single commit): revalidate effective state → claim/fence → write history +
    advance trigger (next eligible) + `notification.requested` outbox → terminal status under
    commit-time fencing → publish `routine:occurrence-committed` after commit.
- `server/infrastructure/routine-schedule/routine-wall-clock-scheduled-handler.ts`
  - `createRoutineWallClockScheduledHandler({ executionSource })` —
    `ScheduledHandlerRegistration` (validate payload; map outcome to succeeded/skipped/
    dead_letter; thrown error → registry retryable).
- In-memory `RoutineOccurrenceStore` for tests; Prisma adapter deferred behind the same port
  (production wiring once W3 routine CRUD exists; no schema change in this phase).

### `packages/schedule-orchestration`

- `projectors/routine-projector.ts` — `createRoutineProjector({ source, schedulingPort })`.
- `runtime/routine-projection-runtime.ts` — subscribes `routine:occurrence-committed`, startup
  reconcile via `listRoutineRefs?` (mirrors goal runtime).
- `ports/projection.ts` + `module.ts` — optional `routineProjection` and `execution.routineSource`;
  when present, register the routine handler on the registry and add the routine runtime.

## Tests

- `next-eligible-occurrence.spec.ts` — Fixture F IANA 23:30 resolution; snooze skip; expiry neutral.
- `routine-schedule-projection-source.test.ts` — plan build; disabled/Elapsed/ActiveUsage → `[]`;
  snooze → next eligible; `listRoutineRefs`.
- `routine-schedule-execution-source.test.ts` — claim idempotency, stale fencing, replay no-dup
  notification, next-trigger advance, publish-on-commit.
- `routine-wall-clock-scheduled-handler.test.ts` — payload validation, outcome mapping, registry
  lookup via `ScheduledHandlerRegistry`.
- `schedule-orchestration` `__tests__/routine-projection-runtime.test.ts` — start reconcile +
  post-commit reprojection (mirrors goal runtime test).

## Ordering / ownership

1. Pure occurrence computation (unit-tested first — no infra).
2. Contract + projection source.
3. Execution source + fence store.
4. Handler.
5. Seam exports.
6. schedule-orchestration wiring + runtime.
7. Tests across both packages; focused `lint`/`typecheck`/`test`.

## Residuals

- ROUTINE-3402 (shadow compare + remove dual wall-clock authority) — separate phase.
- Production routine CRUD (W3) + Prisma occurrence fence adapter + hosts wiring — after routine
  definitions are writable; the port seam is fixed here.

## Phase status (2026-08-26)

Implementation complete and committed: domain occurrence gate, projection source, occurrence
fence store (in-memory) + notification writer, execution source, registered handler, narrow
seams (`schedule-projection/routine`, `schedule-execution/routine` + full-seam exports), and the
schedule-orchestration module wiring (`routineProjection` / `execution.routineSource` optional
seams). Tests: `packages/reminder` full suite 478/478 (18 new on the routine lane, plus 5 on the
domain occurrence gate); `packages/schedule-orchestration` 18/18 (3 new runtime tests). Both
package `tsc` outputs are unchanged relative to the pre-existing baselines (reminder 246
pre-existing path-mapping errors; schedule-orchestration dist-based module-resolution errors) —
no new type errors from the routine lane.