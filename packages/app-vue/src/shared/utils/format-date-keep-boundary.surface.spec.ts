import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveEmptyLabel, DEFAULT_EMPTY_LITERALS } from '@memoflow/time';

/**
 * Residual 1240 (P1): empty-label catalog keep-boundary — not dual private formatDate bodies.
 * Absolute formatting is product-time; empty kinds remain intentional product copy:
 * - app-vue GoalDetailView: formatProductDate + emptyNotSet(t) → notSet
 * - app-react GoalCompareScreen: formatProductDate + emptyKind('dash')
 * Soft residual 1240:
 * - app-react TaskDetail: emptyKind('notSet') + formatProductDateTime
 * - app-vue TaskDetail: formatProductDate + emptyKind('dash')
 * - schedule ScheduleTaskDetailDialog: formatProductDate + emptyKind('na')
 * - reminder ReminderTemplateCard: dateTimeSeconds + emptyUnknown(t)
 * - governance RuleCard: formatProductMonthDay
 * Soft residual 1237: formatTime keep-boundary remains separate.
 * Soft residual 1204: formatDateTime keep-boundary remains separate.
 */
describe('formatDate keep-boundary (residual 1240 / empty catalog)', () => {
  const dir = __dirname;
  const vueGoal = readFileSync(
    resolve(dir, '../../modules/goal/views/GoalDetailView.vue'),
    'utf8',
  );
  const reactGoal = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/GoalCompareScreen.tsx'),
    'utf8',
  );
  const reactTask = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/TaskDetailScreen.tsx'),
    'utf8',
  );
  const vueTask = readFileSync(
    resolve(dir, '../../modules/task/views/TaskDetailView.vue'),
    'utf8',
  );
  const schedule = readFileSync(
    resolve(dir, '../../modules/schedule/components/ScheduleTaskDetailDialog.vue'),
    'utf8',
  );
  const reminder = readFileSync(
    resolve(dir, '../../modules/reminder/components/ReminderTemplateCard.vue'),
    'utf8',
  );
  const rule = readFileSync(
    resolve(dir, '../../modules/governance/components/RuleCard.vue'),
    'utf8',
  );

  it('catalog kinds resolve to distinct empty literals', () => {
    expect(resolveEmptyLabel('notSet')).toBe(DEFAULT_EMPTY_LITERALS.notSet);
    expect(resolveEmptyLabel('dash')).toBe(DEFAULT_EMPTY_LITERALS.dash);
    expect(resolveEmptyLabel('na')).toBe(DEFAULT_EMPTY_LITERALS.na);
    expect(resolveEmptyLabel('unknown')).toBe(DEFAULT_EMPTY_LITERALS.unknown);
    expect(resolveEmptyLabel('notSet')).not.toBe(resolveEmptyLabel('dash'));
    expect(resolveEmptyLabel('notSet', { translate: () => 'i18n:notSet' })).toBe('i18n:notSet');
  });

  it('vue goal uses emptyNotSet + formatProductDate (no local formatDate)', () => {
    expect(vueGoal).not.toMatch(/function formatDate\b/);
    expect(vueGoal).toContain('emptyNotSet');
    expect(vueGoal).toContain('formatProductDate');
    // emptyNotSet(t) resolves goal.detail.notSet via product-time helper default key
    expect(vueGoal).toMatch(/emptyNotSet\(\s*t\s*\)/);
  });

  it('react goal uses emptyKind dash + formatProductDate (no local formatDate)', () => {
    expect(reactGoal).not.toMatch(/function formatDate\b/);
    expect(reactGoal).toContain("emptyKind('dash')");
    expect(reactGoal).toContain('formatProductDate');
    expect(reactGoal).not.toContain('createTimeFacade');
  });

  it('soft residual 1240 sites use catalog kinds without local formatDate bodies', () => {
    expect(reactTask).not.toMatch(/function formatDate\b/);
    expect(reactTask).toContain("emptyKind('notSet')");
    expect(reactTask).toContain('formatProductDateTime');

    expect(vueTask).not.toMatch(/function formatDate\b/);
    expect(vueTask).toContain("emptyKind('dash')");
    expect(vueTask).toContain('formatProductDate');

    expect(schedule).not.toMatch(/function formatDate\b/);
    expect(schedule).toContain("emptyKind('na')");
    expect(schedule).toContain('formatProductDate');

    expect(reminder).not.toMatch(/function formatDate\b/);
    expect(reminder).not.toMatch(/const formatDate\s*=/);
    expect(reminder).toContain('emptyUnknown');
    expect(reminder).toContain('formatProductDateTimeSeconds');

    expect(rule).not.toMatch(/function formatDate\b/);
    expect(rule).toContain('formatProductMonthDay');
  });
});
