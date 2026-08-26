import type { PrismaClient } from '@memoflow/database';
import { requiresDurableScheduleProjection, RoutineDefinition } from '../../domain/routine';
import { deserializeRoutineTrigger } from '../routine-vnext/trigger-persistence-parity';
import type { RoutineScheduleSnapshot, RoutineScheduleStateReader } from './routine-schedule-projection-source';

type PrismaRoutineDefinitionRow = NonNullable<
  Awaited<ReturnType<PrismaClient['routineDefinition']['findUnique']>>
>;

/**
 * Prisma-backed RoutineScheduleStateReader (`routine_definitions`). The ROUTINE
 * schedule lane consumes the same Table/trigger codec the legacy powering
 * tables use (trigger-persistence-parity), so projection and execution agree on
 * canonical occurrence keys.
 *
 * `temporaryOverride` is null: snooze is W4 runtime state with no durable
 * writer yet; tests inject overrides into the in-memory projection directly.
 */
export function createPrismaRoutineScheduleStateReader(
  prisma: PrismaClient,
): RoutineScheduleStateReader {
  return {
    async readRoutineScheduleSnapshot(routineId, identityId) {
      const row = await prisma.routineDefinition.findUnique({
        where: { identityId_id: { identityId, id: routineId } },
      });
      return row ? mapRowToSnapshot(row) : null;
    },

    async listRoutineRefs() {
      const rows = await prisma.routineDefinition.findMany({ where: { enabled: true } });
      return rows
        .filter((row) => {
          const trigger = deserializeRoutineTrigger(row.triggerJson);
          return trigger != null && requiresDurableScheduleProjection(trigger);
        })
        .map((row) => ({ routineId: row.id, identityId: row.identityId }));
    },
  };
}

function mapRowToSnapshot(row: PrismaRoutineDefinitionRow): RoutineScheduleSnapshot {
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
  return { definition, temporaryOverride: null };
}