import type { PrismaClient } from '@memoflow/database';
import { RoutineDefinition } from '../../domain/routine';
import {
  deserializeRoutineTemporaryOverride,
  deserializeRoutineTrigger,
} from '../routine-vnext/trigger-persistence-parity';
import type { RoutineScheduleSnapshot, RoutineScheduleStateReader } from './routine-schedule-projection-source';

type PrismaRoutineDefinitionRow = NonNullable<
  Awaited<ReturnType<PrismaClient['routineDefinition']['findUnique']>>
>;

/**
 * Prisma-backed RoutineScheduleStateReader (`routine_definitions` +
 * `routine_temporary_overrides`). The ROUTINE schedule lane consumes the same
 * Table/trigger codec the legacy powering tables use
 * (trigger-persistence-parity), so projection and execution agree on canonical
 * occurrence keys.
 *
 * `temporaryOverride` is decoded from the durable row written by
 * `PrismaRoutineTemporaryOverrideStore`: a persisted snooze/suppress therefore
 * shifts (or suppresses) the projected durable invocation in production instead
 * of being test-only injected state.
 */
export function createPrismaRoutineScheduleStateReader(
  prisma: PrismaClient,
): RoutineScheduleStateReader {
  return {
    async readRoutineScheduleSnapshot(routineId, identityId) {
      const [row, temporaryOverrideRow] = await Promise.all([
        prisma.routineDefinition.findUnique({
          where: { identityId_id: { identityId, id: routineId } },
        }),
        prisma.routineTemporaryOverride.findUnique({
          where: { identityId_routineId: { identityId, routineId } },
        }),
      ]);
      return row ? mapRowToSnapshot(row, temporaryOverrideRow) : null;
    },

    async listRoutineRefs() {
      // Enumerate every definition, not only currently enabled WallClock rows.
      // A missed disable/trigger-change event must still be able to reconcile
      // the old Scheduler owner to an empty desired set on restart.
      const rows = await prisma.routineDefinition.findMany();
      return rows.map((row) => ({ routineId: row.id, identityId: row.identityId }));
    },
  };
}

function mapRowToSnapshot(
  row: PrismaRoutineDefinitionRow,
  temporaryOverrideRow: Awaited<
    ReturnType<PrismaClient['routineTemporaryOverride']['findUnique']>
  >,
): RoutineScheduleSnapshot {
  const definition = RoutineDefinition.load({
    id: row.id,
    identityId: row.identityId,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    trigger: deserializeRoutineTrigger(row.triggerJson),
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
  return {
    definition,
    temporaryOverride: temporaryOverrideRow
      ? deserializeRoutineTemporaryOverride(temporaryOverrideRow.overrideJson)
      : null,
  };
}