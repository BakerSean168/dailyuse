import type { IScheduleRepository } from '../../domain/repositories/i-schedule-repository';

export interface CacheIntegrityReport {
  isConsistent: boolean;
  totalSchedules: number;
  conflictingCount: number;
  mismatchedCount: number;
  mismatches: Array<{
    id: string;
    expectedHasConflict: boolean;
    actualHasConflict: boolean;
    expectedConflictingEntries: string[];
    actualConflictingEntries: string[] | null;
  }>;
}

/**
 * ScheduleConflictIntegrityService
 *
 * Compares cached conflict projections against base event time-overlap calculations
 * to verify 100% integrity between cache and ground-truth domain events.
 */
export class ScheduleConflictIntegrityService {
  constructor(private readonly scheduleRepository: IScheduleRepository) {}

  async verifyConflictCacheIntegrity(
    identityId: string,
    startTime: number,
    endTime: number,
  ): Promise<CacheIntegrityReport> {
    const schedules = await this.scheduleRepository.findByTimeRange(
      identityId,
      startTime,
      endTime,
    );

    const mismatches: CacheIntegrityReport['mismatches'] = [];
    let conflictingCount = 0;

    for (const schedule of schedules) {
      const overlappingOtherEntries = schedules.filter(
        (other) =>
          other.id !== schedule.id &&
          schedule.startTime < other.endTime &&
          schedule.endTime > other.startTime,
      );

      const expectedHasConflict = overlappingOtherEntries.length > 0;
      const expectedConflictingEntries = overlappingOtherEntries
        .map((e) => e.id)
        .sort();

      if (expectedHasConflict) {
        conflictingCount++;
      }

      const actualHasConflict = schedule.hasConflict;
      const actualConflictingEntries = schedule.conflictingEntries
        ? [...schedule.conflictingEntries].sort()
        : null;

      const hasConflictMatches = actualHasConflict === expectedHasConflict;
      const entriesMatch =
        JSON.stringify(actualConflictingEntries ?? []) ===
        JSON.stringify(expectedConflictingEntries);

      if (!hasConflictMatches || !entriesMatch) {
        mismatches.push({
          id: schedule.id,
          expectedHasConflict,
          actualHasConflict,
          expectedConflictingEntries,
          actualConflictingEntries,
        });
      }
    }

    return {
      isConsistent: mismatches.length === 0,
      totalSchedules: schedules.length,
      conflictingCount,
      mismatchedCount: mismatches.length,
      mismatches,
    };
  }
}
