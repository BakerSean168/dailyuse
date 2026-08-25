# Goal Wave 2 — Shared Contract / Schema Train Handoff

Date: 2026-08-25
Lane: `core-vnext/goal-domain`
Base: `9982e1918447e8710b31f6036c338d8dc51616e0`
Authority: `docs/plan/active/2026-08-25-core-vnext-orchestration.md`

This handoff records only central/shared train work that the Goal lane intentionally does not own. Goal-owned contracts, domain/application code, adapters and tests are implemented in this lane. Do not restore retired Goal semantics while applying this train.

## GOAL-2101 schema train

### Prisma `Goal`

Canonical Goal business fields after GOAL-2101:

- `id`
- `identityId`
- `name`
- `description`
- `feasibilityAnalysis`
- `motivation`
- `status`: `Active | Completed | Abandoned`
- `startDate`
- `dueDate`
- `completedAt`
- `archivedAt` (independent display/persistence attribute; not a business status)
- `sortOrder`
- `reminderConfig`
- `version`
- audit/delete timestamps
- KR / review / weight-snapshot relations
- shared Label assignment through `GoalLabel`

Retire from the central Prisma schema and generated client:

- `Goal.color`
- `Goal.importance`
- `Goal.priority`
- `Goal.category`
- `Goal.tags`
- `Goal.folderId`
- `Goal.parentGoalId`
- `Goal.rollupPolicy`
- hierarchy/folder indexes and relations that only serve those fields
- `GoalFolder` model and GoalFolder-only relations
- Goal-owned `FocusMode` / `FocusSession` models and relations

Rename `Goal.targetDate` -> `Goal.dueDate`. There is no production data worth preserving, so a destructive reset is acceptable and preferred over long-lived aliases/dual-write.

`GoalLabel` is retained. Preserve its identity isolation:

- composite uniqueness on `(identityId, goalId, labelId)`
- Goal/Label foreign keys
- indexes supporting identity-scoped Goal and Label lookup

### PowerSync schema

Apply the same semantic train:

- remove the retired Goal physical columns listed above;
- remove GoalFolder / Goal Focus tables and indexes;
- rename `goals.target_date` -> `goals.due_date` (or recreate the table with `due_date` during destructive reset);
- retain `labels` + `goal_labels` with identity-scoped ownership and uniqueness.

The Goal lane currently adapts canonical `dueDate` to the legacy physical `targetDate` / `target_date` column only as a temporary schema-train seam. PowerSync inserts also provide neutral values for legacy non-null/default columns where the current central schema still requires them. Remove those adapter seams immediately after the shared reset/regeneration.

### Generated outputs / reset

After central schema edits:

1. destructive dev/test DB reset is allowed;
2. regenerate Prisma client through the canonical workspace target (never hand-edit generated code);
3. regenerate/reconcile PowerSync schema artifacts;
4. update central schema inventory tests that intentionally describe the retired Goal Folder/Focus/legacy fields;
5. rerun Goal typecheck/tests plus API/Desktop composition tests.

### Consumer impact

Expected breaking changes are intentional:

- old Goal UI/client consumers must stop sending/reading `color`, `importance`, `priority`, `category`, string `tags`, `folderId`, `parentGoalId`, `rollupPolicy`, `targetDate`;
- Goal list classification uses Shared Labels (`labelIds` mutation, `labels[]` projection, `labelIdsAll` strict AND filter);
- Goal business status no longer contains `Archived`; `archivedAt` is independent;
- explicit abandon uses `Abandoned` and the `goal:abandon` / HTTP+IPC command;
- Goal Folder / Focus / auto-archive-expired transport surfaces are retired.

## Later Wave 2 additions

GOAL-2102 KR Measurement V2 and GOAL-2103 Review V2 central schema changes will be appended to this same handoff before the lane finishes, so the Schema Train can be applied as one destructive reset/regeneration pass.

### Shared test inventory handoff

`packages/contracts/src/modules/schedule/value-objects/map-importance-to-task-priority-dual.surface.spec.ts`
currently asserts that the Goal legacy schedule projection imports/calls
`mapImportanceToTaskPriority(goalDTO.importance)`. GOAL-2101 intentionally retires Goal
`importance`; the Goal-owned legacy projection now uses neutral `TaskPriority.Normal` only
as a compile-safe bridge until the authorized Wave 3 scheduling projector migration.
This Schedule-owned cross-domain surface test must be reconciled by the Scheduling/Shared
Train owner; the Goal lane does not modify Schedule contracts/tests in Wave 2.
