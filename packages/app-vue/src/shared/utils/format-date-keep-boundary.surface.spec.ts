import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_EMPTY_LITERALS, resolveEmptyLabel } from '@memoflow/time';

describe('Product date presentation boundary', () => {
  const dir = __dirname;
  const goalDetail = readFileSync(resolve(dir, '../../modules/goal/views/GoalDetailView.vue'), 'utf8');
  const goalCard = readFileSync(resolve(dir, '../../modules/goal/components/cards/GoalCard.vue'), 'utf8');
  const taskDetail = readFileSync(resolve(dir, '../../modules/task/views/TaskDetailView.vue'), 'utf8');
  const taskPresentation = readFileSync(resolve(dir, '../../modules/task/utils/task-template-presentation.ts'), 'utf8');
  const schedule = readFileSync(resolve(dir, '../../modules/schedule/components/ScheduleTaskDetailDialog.vue'), 'utf8');
  const reminder = readFileSync(resolve(dir, '../../modules/reminder/components/ReminderTemplateCard.vue'), 'utf8');
  const rule = readFileSync(resolve(dir, '../../modules/governance/components/RuleCard.vue'), 'utf8');

  it('keeps semantic empty labels distinct', () => {
    expect(resolveEmptyLabel('notSet')).toBe(DEFAULT_EMPTY_LITERALS.notSet);
    expect(resolveEmptyLabel('dash')).toBe(DEFAULT_EMPTY_LITERALS.dash);
    expect(resolveEmptyLabel('na')).toBe(DEFAULT_EMPTY_LITERALS.na);
    expect(resolveEmptyLabel('unknown')).toBe(DEFAULT_EMPTY_LITERALS.unknown);
  });

  it('renders Goal dates directly through Product Time without local Date wrappers', () => {
    for (const source of [goalDetail, goalCard]) {
      expect(source).toContain('formatProductDate');
      expect(source).not.toMatch(/function formatDate\b/);
      expect(source).not.toContain('toISOString');
      expect(source).not.toContain('toLocaleDateString');
    }
    expect(goalDetail).toContain('emptyNotSet');
  });

  it('keeps Task date formatting in the presentation mapper rather than the detail view', () => {
    expect(taskPresentation).toContain('formatProductDate');
    expect(taskPresentation).toContain('formattedCreatedAt');
    expect(taskDetail).toContain('formattedCreatedAt');
    expect(taskDetail).not.toMatch(/function formatDate\b/);
    expect(taskDetail).not.toContain('new Date(');
  });

  it('keeps other date surfaces on Product Time helpers', () => {
    expect(schedule).toContain('formatProductDate');
    expect(schedule).toContain("emptyKind('na')");
    expect(reminder).toContain('formatProductDateTimeSeconds');
    expect(reminder).toContain('emptyUnknown');
    expect(rule).toContain('formatProductMonthDay');
  });
});
