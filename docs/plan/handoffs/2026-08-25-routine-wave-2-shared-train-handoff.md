---
tags:
  - plan
  - handoff
  - core-vnext
  - routine
  - schema-train
description: ROUTINE-2301..2303 feature-lane handoff for Core vNext shared Contract/Schema/PowerSync integration.
created: 2026-08-25T23:41:00+08:00
updated: 2026-08-26T00:32:00+08:00
---

# Core vNext Routine Domain / Wave 2 — Shared Train Handoff

> Execution truth remains `docs/plan/active/2026-08-25-core-vnext-orchestration.md`.
> This file is a handoff, not a second active plan.
>
> Feature lane: `core-vnext/routine-domain`
> Exact base: `9982e1918447e8710b31f6036c338d8dc51616e0`
>
> Per Wave 2 single-writer rules this lane intentionally does **not** edit
> `packages/contracts/**`, the central Prisma schema/generated client, or the
> shared PowerSync root. Those physical shared changes must be landed by the
> controller-owned Shared Train after this feature lane is integrated.

## ROUTINE-2301 — Schema Train request

The lane owns the canonical business model and parity mappers under:

```text
packages/reminder/src/server/domain/routine/**
packages/reminder/src/server/infrastructure/routine-vnext/profile-persistence-parity.ts
```

The physical shared schema must represent the same truth with three first-class tables:

```text
routine_definitions
routine_profiles
routine_profile_memberships
```

### `routine_definitions`

Required fields:

```text
id           TEXT PK
identity_id  TEXT NOT NULL
name         TEXT NOT NULL
description  TEXT NULL
enabled      BOOLEAN NOT NULL DEFAULT true
version      INTEGER NOT NULL
created_at   TIMESTAMP NOT NULL
updated_at   TIMESTAMP NOT NULL
```

Required ownership/indexing:

```text
UNIQUE(identity_id, id)
INDEX(identity_id, enabled)
```

### `routine_profiles`

Required fields:

```text
id           TEXT PK
identity_id  TEXT NOT NULL
name         TEXT NOT NULL
description  TEXT NULL
enabled      BOOLEAN NOT NULL DEFAULT true
active       BOOLEAN NOT NULL DEFAULT false
version      INTEGER NOT NULL
created_at   TIMESTAMP NOT NULL
updated_at   TIMESTAMP NOT NULL
```

Required ownership/indexing:

```text
UNIQUE(identity_id, id)
INDEX(identity_id, enabled, active)
```

### `routine_profile_memberships`

This is a real M:N edge. Do not recreate legacy `ReminderTemplate.reminderGroupId` as the canonical relationship.

Required fields:

```text
identity_id  TEXT NOT NULL
profile_id   TEXT NOT NULL
routine_id   TEXT NOT NULL
enabled      BOOLEAN NOT NULL DEFAULT true
version      INTEGER NOT NULL
created_at   TIMESTAMP NOT NULL
updated_at   TIMESTAMP NOT NULL
```

Required identity/constraints:

```text
PRIMARY KEY(identity_id, profile_id, routine_id)
FK(identity_id, profile_id) -> routine_profiles(identity_id, id)
FK(identity_id, routine_id) -> routine_definitions(identity_id, id)
INDEX(identity_id, routine_id)
INDEX(identity_id, profile_id)
```

The same `Drink Water` routine must therefore be able to hold independent rows such as:

```text
(identity-1, work,   drink-water, enabled=true)
(identity-1, gaming, drink-water, enabled=false)
```

### PowerSync parity

Add the same three tables/columns to the PowerSync shared schema in the **same Shared Train change**. Boolean fields use integer `0/1` at the SQLite edge; timestamps use the repository's ISO text convention. The lane-local parity test normalizes Prisma and PowerSync representations and requires equality of business truth.

### Canonical effective state — do not duplicate in persistence/projectors

There is exactly one formula:

```text
effectiveEnabled =
  routine.enabled
  && profile.enabled
  && profile.active
  && membership.enabled
  && temporaryOverrideAllowsExecution
```

An unprofiled routine supplies neutral `true` values for profile/membership gates. The legacy identity-wide Reminder master switch is folded into the Routine gate only at the short-lived Reminder adapter seam; it must not become a second vNext formula.

Profile off/deactivate never mutates `membership.enabled` or `routine.enabled`. Profile on/reactivate never revives a disabled membership or Routine.

### Legacy destructive migration

New canonical tables contain **no `control_mode`**. `ControlMode` remains only on legacy Reminder DTO/schema until Shared Train/controller chooses the destructive cutover point. Because this project has no important production data, no long-lived dual-write/backfill compatibility is required.

The canonical M:N model also supersedes the legacy single `reminder_group_id` relationship. Do not delete ReminderOccurrence or the Reminder runtime reliability tables as part of this schema migration.

## ROUTINE-2302 — Trigger / Schema Train request

Canonical domain implementation:

```text
packages/reminder/src/server/domain/routine/trigger.ts
packages/reminder/src/server/infrastructure/routine-vnext/trigger-persistence-parity.ts
```

`RoutineDefinition.trigger` is the long-lived trigger truth. Add this field to both physical representations of `routine_definitions`:

```text
Prisma/Postgres: trigger_json TEXT NULL @map("trigger_json")
PowerSync/SQLite: trigger_json TEXT NULL
```

The JSON payload is a tagged union with exactly these variants and timing owners:

```text
WallClock   -> timingOwner = scheduler
Elapsed     -> timingOwner = local-runtime
ActiveUsage -> timingOwner = local-runtime
```

`Protocol` is intentionally not a trigger variant.

### WallClock

Required payload:

```text
type = WallClock
timingOwner = scheduler
localTime = Hm
timeZone = validated IANA zone
recurrence = {
  startDate: Ymd
  frequency: daily | weekly | monthly | yearly
  interval: positive integer
  byWeekday: 0..6[]
  count: positive integer | null
  until: Instant | null
}
```

Occurrence math must call Wave 1 `RecurrenceEnginePort`. Do not duplicate RRULE/date math in Routine or Scheduler.

### Elapsed / ActiveUsage

These are local deterministic runtime truth:

```text
Elapsed.durationMs + anchor
ActiveUsage.requiredActiveMs + anchor + naturalBreakCredit
```

They must **not** produce durable `ScheduleTask`/`ScheduledIntent` projection. W4 owns the desktop/local runtime implementation.

### Legacy migration

```text
FixedTime -> WallClock
legacy timezone null -> explicit UTC (the existing legacy contract)

Interval -> Elapsed by default
Interval -> ActiveUsage only with explicit migration evidence
legacy Interval.startTime -> runtime anchor state, not long-lived trigger config
```

Do not infer ActiveUsage from a numeric interval alone.

### TemporaryOverride / snooze

The W2 domain contract is real state, not response analytics:

```text
snoozeUntil
suppressUntil
overrideIntervalMs
expiresAt
reason
source = user | ai | runtime
```

It does not rewrite `RoutineDefinition.trigger`. The lane supplies a validated persistence codec so W4 can crash-recover this state. Do **not** add the override JSON to `routine_definitions`; W4 should persist it in the local runtime-state store/table appropriate to its ownership.

The canonical effective-enabled evaluator consumes only the derived gate `temporaryOverrideAllowsExecution`; the override contract itself remains separate state.

### Trigger ownership matrix

| Trigger | Timing truth owner | Durable Scheduler projection | Runtime implementation now |
| --- | --- | --- | --- |
| WallClock | Scheduler + RecurrenceEnginePort projection contract | yes, **Wave 3 only** | domain calculation contract only |
| Elapsed | local deterministic runtime | no | W4 |
| ActiveUsage | local deterministic runtime + Activity/Idle sensors | no | W4 |

No W2 code adds a second wall-clock authority or edits the existing Scheduler engine.

## ROUTINE-2303 — pending feature-lane details

To be appended by this worker after the protocol model is complete.
