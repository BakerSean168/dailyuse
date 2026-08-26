import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('status presentation ownership', () => {
  const dir = __dirname;
  const schedule = readFileSync(resolve(dir, '../../modules/schedule/utils/schedule-presentation.ts'), 'utf8');
  const goalDetail = readFileSync(resolve(dir, '../../modules/goal/views/GoalDetailView.vue'), 'utf8');
  const goalCard = readFileSync(resolve(dir, '../../modules/goal/components/cards/GoalCard.vue'), 'utf8');

  it('keeps Scheduler status translation in the schedule presentation boundary', () => {
    expect(schedule).toMatch(/export function getStatusLabel\b/);
    expect(schedule).toContain('ScheduleTaskStatus');
    expect(schedule).toContain('schedule.taskStatus.paused');
    expect(schedule).toContain('schedule.taskStatus.failed');
  });

  it('renders the simplified Goal status directly without resurrecting Draft/Archived mapping logic', () => {
    for (const source of [goalDetail, goalCard]) {
      expect(source).toContain('goal.status');
      expect(source).not.toMatch(/getStatusLabel\b/);
      expect(source).not.toContain('goal.cards.goalStatus.draft');
      expect(source).not.toContain('goal.cards.goalStatus.archived');
    }
  });
});
