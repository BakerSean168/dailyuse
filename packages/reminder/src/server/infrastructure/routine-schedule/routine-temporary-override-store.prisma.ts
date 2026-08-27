import type { PrismaClient } from '@memoflow/database';
import type { RoutineTemporaryOverride } from '../../domain/routine';
import type { RoutineTemporaryOverrideStore } from '../../domain/ports/routine-temporary-override-store.port';
import { serializeRoutineTemporaryOverride } from '../routine-vnext/trigger-persistence-parity';

/**
 * Prisma snooze/suppress store (`routine_temporary_overrides`, ROUTINE-3401).
 *
 * One durable override row per routine, encoded with the W2 trigger-parity
 * codec. `setRoutineTemporaryOverride` upserts a single active override (a
 * snooze replaces any prior suppress/snooze); `clearRoutineTemporaryOverride`
 * restores the canonical recurrence. The state reader serves the same row back
 * to projection and execution.
 */
export class PrismaRoutineTemporaryOverrideStore implements RoutineTemporaryOverrideStore {
  constructor(private readonly prisma: PrismaClient) {}

  async setRoutineTemporaryOverride(input: {
    readonly identityId: string;
    readonly routineId: string;
    readonly override: RoutineTemporaryOverride;
  }): Promise<void> {
    const { identityId, routineId, override } = input;
    const overrideJson = serializeRoutineTemporaryOverride(override);
    if (overrideJson == null) {
      throw new TypeError('Expected a non-null RoutineTemporaryOverride to serialize');
    }
    await this.prisma.routineTemporaryOverride.upsert({
      where: { identityId_routineId: { identityId, routineId } },
      create: {
        identityId,
        routineId,
        overrideJson,
      },
      update: {
        overrideJson,
      },
    });
  }

  async clearRoutineTemporaryOverride(input: {
    readonly identityId: string;
    readonly routineId: string;
  }): Promise<void> {
    await this.prisma.routineTemporaryOverride.deleteMany({
      where: {
        identityId: input.identityId,
        routineId: input.routineId,
      },
    });
  }
}