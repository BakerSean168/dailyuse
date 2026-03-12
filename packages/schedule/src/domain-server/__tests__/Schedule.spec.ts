/**
 * Schedule Aggregate - Unit Tests
 *
 * Tests for conflict detection domain logic
 * Story 9.1 (EPIC-SCHEDULE-001)
 */

import { Schedule } from '../aggregates/schedule';
import { ScheduleId } from '../../domain-shared/value-objects/schedule-id';

describe('Schedule Aggregate', () => {
  // ===== Test Data Fixtures =====

  const createTestSchedule = (params: {
    id?: string;
    identityId?: string;
    title?: string;
    startTime: number;
    endTime: number;
  }): Schedule => {
    return Schedule.create({
      identityId: params.identityId || 'acc-123',
      title: params.title || 'Test Meeting',
      startTime: params.startTime,
      endTime: params.endTime,
    });
  };

  // Helper: Create timestamp from hour (e.g., 14 -> 2:00 PM on Oct 21, 2025)
  const hour = (h: number): number => {
    return new Date('2025-10-21').getTime() + h * 60 * 60 * 1000;
  };

  // ===== Factory Method Tests =====

  describe('create()', () => {
    it('should create a schedule with valid parameters', () => {
      const schedule = Schedule.create({
        identityId: 'acc-123',
        title: 'Team Meeting',
        description: 'Weekly sync',
        startTime: hour(14), // 2:00 PM
        endTime: hour(15), // 3:00 PM
        priority: 5,
        location: 'Conf Room A',
        attendees: ['user1', 'user2'],
      });

      expect(schedule).toBeDefined();
      expect(schedule.id).toBeDefined();
      expect(schedule.identityId).toBe('acc-123');
      expect(schedule.title).toBe('Team Meeting');
      expect(schedule.description).toBe('Weekly sync');
      expect(schedule.duration).toBe(60); // 1 hour in minutes
      expect(schedule.hasConflict).toBe(false);
      expect(schedule.conflictingEntries).toBeNull();
    });

    it('should throw error if startTime >= endTime', () => {
      expect(() => {
        Schedule.create({
          identityId: 'acc-123',
          title: 'Invalid Schedule',
          startTime: hour(15),
          endTime: hour(14), // endTime before startTime
        });
      }).toThrow('CalendarEntry startTime must be before endTime');
    });

    it('should throw error if startTime === endTime', () => {
      expect(() => {
        Schedule.create({
          identityId: 'acc-123',
          title: 'Zero Duration',
          startTime: hour(14),
          endTime: hour(14), // Same time
        });
      }).toThrow('CalendarEntry startTime must be before endTime');
    });

    it('should calculate duration correctly', () => {
      const schedule = Schedule.create({
        identityId: 'acc-123',
        title: 'Long Meeting',
        startTime: hour(9), // 9:00 AM
        endTime: hour(12), // 12:00 PM
      });

      expect(schedule.duration).toBe(180); // 3 hours = 180 minutes
    });
  });

  describe('load()', () => {
    it('should load schedule from state', () => {
      const dto = {
        id: ScheduleId.of('IScheduleId_sched-456'),
        identityId: 'acc-789',
        title: 'Client Meeting',
        description: 'Discuss project',
        startTime: hour(10),
        endTime: hour(11),
        duration: 60,
        hasConflict: true,
        conflictingEntries: ['sched-111', 'sched-222'],
        priority: 4,
        location: 'Zoom',
        attendees: ['client@example.com'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const schedule = Schedule.load(dto);

      expect(schedule.id).toBe('IScheduleId_sched-456');
      expect(schedule.identityId).toBe('acc-789');
      expect(schedule.title).toBe('Client Meeting');
      expect(schedule.hasConflict).toBe(true);
      expect(schedule.conflictingEntries).toEqual(['sched-111', 'sched-222']);
    });
  });

  // ===== Conflict Detection Tests =====

  describe('detectConflicts()', () => {
    it('should return no conflicts when schedules do not overlap', () => {
      const schedule1 = createTestSchedule({
        title: 'Morning Meeting',
        startTime: hour(9), // 9:00 AM
        endTime: hour(10), // 10:00 AM
      });

      const schedule2 = createTestSchedule({
        title: 'Afternoon Meeting',
        startTime: hour(14), // 2:00 PM
        endTime: hour(15), // 3:00 PM
      });

      const result = schedule1.detectConflicts([schedule2]);

      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should return no conflicts when passed empty array', () => {
      const schedule = createTestSchedule({
        startTime: hour(10),
        endTime: hour(11),
      });

      const result = schedule.detectConflicts([]);

      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should detect single conflict with correct details', () => {
      const schedule1 = createTestSchedule({
        title: 'Meeting A',
        startTime: hour(14), // 2:00 PM
        endTime: hour(15.5), // 3:30 PM
      });

      const schedule2 = createTestSchedule({
        title: 'Meeting B',
        startTime: hour(15), // 3:00 PM
        endTime: hour(16), // 4:00 PM
      });

      const result = schedule1.detectConflicts([schedule2]);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);

      const conflict = result.conflicts[0];
      expect(conflict.scheduleId).toBe(schedule2.id);
      expect(conflict.scheduleTitle).toBe('Meeting B');
      expect(conflict.overlapStart).toBe(hour(15)); // Overlap starts at 3:00 PM
      expect(conflict.overlapEnd).toBe(hour(15.5)); // Overlap ends at 3:30 PM
      expect(conflict.overlapDuration).toBe(30); // 30 minutes overlap
    });

    it('should detect multiple conflicts', () => {
      const targetSchedule = createTestSchedule({
        title: 'Long Meeting',
        startTime: hour(14), // 2:00 PM
        endTime: hour(17), // 5:00 PM
      });

      const conflict1 = createTestSchedule({
        title: 'Meeting 1',
        startTime: hour(13),
        endTime: hour(14.5), // Overlaps 2:00-2:30 PM
      });

      const conflict2 = createTestSchedule({
        title: 'Meeting 2',
        startTime: hour(15),
        endTime: hour(16), // Overlaps 3:00-4:00 PM
      });

      const conflict3 = createTestSchedule({
        title: 'Meeting 3',
        startTime: hour(16.5),
        endTime: hour(18), // Overlaps 4:30-5:00 PM
      });

      const result = targetSchedule.detectConflicts([conflict1, conflict2, conflict3]);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(3);
      expect(result.conflicts[0].scheduleTitle).toBe('Meeting 1');
      expect(result.conflicts[1].scheduleTitle).toBe('Meeting 2');
      expect(result.conflicts[2].scheduleTitle).toBe('Meeting 3');
    });

    it('should filter out non-overlapping schedules', () => {
      const targetSchedule = createTestSchedule({
        startTime: hour(14),
        endTime: hour(15),
      });

      const beforeSchedule = createTestSchedule({
        title: 'Before',
        startTime: hour(10),
        endTime: hour(11),
      });

      const overlapSchedule = createTestSchedule({
        title: 'Overlap',
        startTime: hour(14.5),
        endTime: hour(15.5),
      });

      const afterSchedule = createTestSchedule({
        title: 'After',
        startTime: hour(16),
        endTime: hour(17),
      });

      const result = targetSchedule.detectConflicts([
        beforeSchedule,
        overlapSchedule,
        afterSchedule,
      ]);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].scheduleTitle).toBe('Overlap');
    });
  });

  // ===== isOverlapping Tests (via detectConflicts behavior) =====

  describe('isOverlapping() edge cases', () => {
    it('should NOT overlap when schedules are adjacent (A ends when B starts)', () => {
      const scheduleA = createTestSchedule({
        title: 'Meeting A',
        startTime: hour(14), // 2:00 PM
        endTime: hour(15), // 3:00 PM
      });

      const scheduleB = createTestSchedule({
        title: 'Meeting B',
        startTime: hour(15), // 3:00 PM (exactly when A ends)
        endTime: hour(16), // 4:00 PM
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.hasConflict).toBe(false);
      expect(result.conflicts).toHaveLength(0);
    });

    it('should overlap when partial overlap at start', () => {
      const scheduleA = createTestSchedule({
        startTime: hour(14), // 2:00 PM
        endTime: hour(15.5), // 3:30 PM
      });

      const scheduleB = createTestSchedule({
        startTime: hour(15), // 3:00 PM (starts during A)
        endTime: hour(16), // 4:00 PM
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts[0].overlapDuration).toBe(30); // 30 min overlap
    });

    it('should overlap when partial overlap at end', () => {
      const scheduleA = createTestSchedule({
        startTime: hour(15), // 3:00 PM
        endTime: hour(16), // 4:00 PM
      });

      const scheduleB = createTestSchedule({
        startTime: hour(14), // 2:00 PM
        endTime: hour(15.5), // 3:30 PM (ends during A)
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts[0].overlapDuration).toBe(30); // 30 min overlap
    });

    it('should overlap when schedule A completely contains schedule B', () => {
      const scheduleA = createTestSchedule({
        title: 'Long Meeting',
        startTime: hour(14), // 2:00 PM
        endTime: hour(17), // 5:00 PM
      });

      const scheduleB = createTestSchedule({
        title: 'Short Meeting',
        startTime: hour(15), // 3:00 PM (inside A)
        endTime: hour(16), // 4:00 PM (inside A)
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts[0].overlapDuration).toBe(60); // Full 1 hour of B
    });

    it('should overlap when schedule B completely contains schedule A', () => {
      const scheduleA = createTestSchedule({
        title: 'Short Meeting',
        startTime: hour(15), // 3:00 PM
        endTime: hour(16), // 4:00 PM
      });

      const scheduleB = createTestSchedule({
        title: 'Long Meeting',
        startTime: hour(14), // 2:00 PM (contains A)
        endTime: hour(17), // 5:00 PM (contains A)
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts[0].overlapDuration).toBe(60); // Full 1 hour of A
    });

    it('should NOT overlap when schedule A is completely before B', () => {
      const scheduleA = createTestSchedule({
        startTime: hour(10),
        endTime: hour(11),
      });

      const scheduleB = createTestSchedule({
        startTime: hour(14),
        endTime: hour(15),
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.hasConflict).toBe(false);
    });

    it('should NOT overlap when schedule A is completely after B', () => {
      const scheduleA = createTestSchedule({
        startTime: hour(16),
        endTime: hour(17),
      });

      const scheduleB = createTestSchedule({
        startTime: hour(14),
        endTime: hour(15),
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.hasConflict).toBe(false);
    });

    it('should overlap when schedules have exact same time', () => {
      const scheduleA = createTestSchedule({
        startTime: hour(14),
        endTime: hour(15),
      });

      const scheduleB = createTestSchedule({
        startTime: hour(14), // Same start
        endTime: hour(15), // Same end
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.hasConflict).toBe(true);
      expect(result.conflicts[0].overlapDuration).toBe(60); // Full overlap
    });
  });

  // ===== calculateOverlap Tests =====

  describe('calculateOverlap()', () => {
    it('should calculate correct overlap duration', () => {
      const scheduleA = createTestSchedule({
        startTime: hour(14), // 2:00 PM
        endTime: hour(15.5), // 3:30 PM
      });

      const scheduleB = createTestSchedule({
        startTime: hour(15), // 3:00 PM
        endTime: hour(16), // 4:00 PM
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.conflicts[0].overlapDuration).toBe(30); // 30 minutes
    });

    it('should calculate overlap for complete containment', () => {
      const scheduleA = createTestSchedule({
        startTime: hour(14),
        endTime: hour(17),
      });

      const scheduleB = createTestSchedule({
        startTime: hour(15),
        endTime: hour(16),
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.conflicts[0].overlapDuration).toBe(60); // 1 hour
    });

    it('should handle 1-minute overlap', () => {
      const scheduleA = createTestSchedule({
        startTime: hour(14),
        endTime: hour(15) + 60000, // 3:01 PM
      });

      const scheduleB = createTestSchedule({
        startTime: hour(15), // 3:00 PM
        endTime: hour(16),
      });

      const result = scheduleA.detectConflicts([scheduleB]);

      expect(result.conflicts[0].overlapDuration).toBe(1); // 1 minute
    });
  });

  // ===== generateSuggestions Tests =====

  describe('generateSuggestions()', () => {
    it('should suggest moving earlier (before conflict)', () => {
      const targetSchedule = createTestSchedule({
        startTime: hour(14), // 2:00 PM
        endTime: hour(15), // 3:00 PM (60 min duration)
      });

      const conflictSchedule = createTestSchedule({
        startTime: hour(14.5), // 2:30 PM
        endTime: hour(16),
      });

      const result = targetSchedule.detectConflicts([conflictSchedule]);

      const moveEarlierSuggestion = result.suggestions.find((s) => s.type === 'MoveEarlier');
      expect(moveEarlierSuggestion).toBeDefined();
      expect(moveEarlierSuggestion!.newEndTime).toBe(hour(14.5)); // End at 2:30 PM
      expect(moveEarlierSuggestion!.newStartTime).toBe(hour(13.5)); // Start at 1:30 PM (60 min before)
    });

    it('should suggest moving later (after conflict)', () => {
      const targetSchedule = createTestSchedule({
        startTime: hour(14), // 2:00 PM
        endTime: hour(15), // 3:00 PM (60 min duration)
      });

      const conflictSchedule = createTestSchedule({
        startTime: hour(14.5), // 2:30 PM
        endTime: hour(16), // 4:00 PM
      });

      const result = targetSchedule.detectConflicts([conflictSchedule]);

      const moveLaterSuggestion = result.suggestions.find((s) => s.type === 'MoveLater');
      expect(moveLaterSuggestion).toBeDefined();
      expect(moveLaterSuggestion!.newStartTime).toBe(hour(16)); // Start at 4:00 PM
      expect(moveLaterSuggestion!.newEndTime).toBe(hour(17)); // End at 5:00 PM (60 min later)
    });

    it('should suggest shortening when target starts before conflict', () => {
      const targetSchedule = createTestSchedule({
        startTime: hour(14), // 2:00 PM
        endTime: hour(16), // 4:00 PM
      });

      const conflictSchedule = createTestSchedule({
        startTime: hour(15), // 3:00 PM
        endTime: hour(17),
      });

      const result = targetSchedule.detectConflicts([conflictSchedule]);

      const shortenSuggestion = result.suggestions.find((s) => s.type === 'Shorten');
      expect(shortenSuggestion).toBeDefined();
      expect(shortenSuggestion!.newStartTime).toBe(hour(14)); // Keep start at 2:00 PM
      expect(shortenSuggestion!.newEndTime).toBe(hour(15)); // Shorten to end at 3:00 PM
    });

    it('should handle multiple conflicts with earliest and latest', () => {
      const targetSchedule = createTestSchedule({
        startTime: hour(14),
        endTime: hour(17),
      });

      const conflict1 = createTestSchedule({
        startTime: hour(13), // Earliest
        endTime: hour(14.5),
      });

      const conflict2 = createTestSchedule({
        startTime: hour(16),
        endTime: hour(18), // Latest
      });

      const result = targetSchedule.detectConflicts([conflict1, conflict2]);

      const moveEarlier = result.suggestions.find((s) => s.type === 'MoveEarlier');
      const moveLater = result.suggestions.find((s) => s.type === 'MoveLater');

      // Should suggest before earliest (13:00)
      expect(moveEarlier!.newEndTime).toBe(hour(13));

      // Should suggest after latest (18:00)
      expect(moveLater!.newStartTime).toBe(hour(18));
    });

    it('should always return at least 2 suggestions (move_earlier and move_later)', () => {
      const targetSchedule = createTestSchedule({
        startTime: hour(14),
        endTime: hour(15),
      });

      const conflictSchedule = createTestSchedule({
        startTime: hour(14.5),
        endTime: hour(16),
      });

      const result = targetSchedule.detectConflicts([conflictSchedule]);

      expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
      expect(result.suggestions.some((s) => s.type === 'MoveEarlier')).toBe(true);
      expect(result.suggestions.some((s) => s.type === 'MoveLater')).toBe(true);
    });
  });

  // ===== DTO Conversion Tests =====

  describe('toServerDTO()', () => {
    it('should convert to ServerDTO correctly', () => {
      const schedule = Schedule.create({
        identityId: 'acc-123',
        title: 'Team Standup',
        description: 'Daily sync',
        startTime: hour(9),
        endTime: hour(9.25), // 15 minutes
        priority: 3,
        location: 'Slack',
        attendees: ['team@example.com'],
      });

      const dto = schedule.toServerDTO();

      expect(dto.id).toBe(schedule.id);
      expect(dto.identityId).toBe('acc-123');
      expect(dto.title).toBe('Team Standup');
      expect(dto.description).toBe('Daily sync');
      expect(dto.duration).toBe(15);
      expect(dto.hasConflict).toBe(false);
      expect(dto.conflictingEntries).toBeUndefined();
      expect(dto.priority).toBe(3);
      expect(dto.location).toBe('Slack');
      expect(dto.attendees).toEqual(['team@example.com']);
    });

    it('should handle nullable fields correctly', () => {
      const schedule = Schedule.create({
        identityId: 'acc-123',
        title: 'Simple Meeting',
        startTime: hour(10),
        endTime: hour(11),
      });

      const dto = schedule.toServerDTO();

      expect(dto.description).toBeUndefined();
      expect(dto.priority).toBeUndefined();
      expect(dto.location).toBeUndefined();
      expect(dto.attendees).toBeUndefined();
      expect(dto.conflictingEntries).toBeUndefined();
    });
  });
});
