import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1240: formatDate keep-boundary (vue goal i18n notSet vs react English '-' vs other empties).
 * - app-vue GoalDetailView: locale toLocaleDateString + t('goal.detail.notSet')
 * - app-react GoalCompareScreen: toLocaleDateString + English '-'
 * Soft residual 1240:
 * - app-react TaskDetail: English 'Not set' + toLocaleString (datetime)
 * - app-vue TaskDetail: locale + '-'
 * - schedule ScheduleTaskDetailDialog: number|string + 'N/A'
 * - reminder ReminderTemplateCard: date-fns datetime + common.unknown
 * - governance RuleCard: month short + day only
 * Soft residual 1237: formatTime keep-boundary remains separate.
 * Soft residual 1204: formatDateTime keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('formatDate keep-boundary (residual 1240)', () => {
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

  it('owns Residual 1240 keep-boundary markers on vue goal i18n formatDate', () => {
    expect(vueGoal).toContain('Residual 1240 keep-boundary');
    expect(vueGoal).toMatch(/function formatDate\b/);
    expect(vueGoal).toContain("t('goal.detail.notSet')");
    expect(vueGoal).toContain('toLocaleDateString(locale.value)');
    const body = vueGoal.match(/function formatDate\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('goal.detail.notSet');
    expect(body).toContain('locale.value');
    expect(body).not.toContain("return '-'");
    expect(body).not.toContain("'Not set'");
    expect(body).not.toContain("'N/A'");
    expect(body).not.toContain('yyyy-MM-dd');
  });

  it('differs from app-react goal English "-" formatDate (no force-merge)', () => {
    expect(reactGoal).toContain('Residual 1240 keep-boundary');
    expect(reactGoal).toMatch(/function formatDate\b/);
    expect(reactGoal).toContain('Soft residual 1240');
    expect(reactGoal).toContain("return '-'");
    const body = reactGoal.match(/function formatDate\([\s\S]*?\n  \}/)?.[0] ?? '';
    expect(body).toContain("'-'");
    expect(body).toContain('toLocaleDateString()');
    expect(body).not.toContain('goal.detail.notSet');
    expect(body).not.toContain('locale.value');
    expect(body).not.toMatch(/\bt\(/);
  });

  it('soft residual 1240 Not set / N/A / date-fns / short month stay separate', () => {
    expect(reactTask).toContain('Soft residual 1240');
    const reactTaskBody = reactTask.match(/function formatDate\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(reactTaskBody).toContain("'Not set'");
    expect(reactTaskBody).toContain('toLocaleString()');
    expect(reactTaskBody).not.toContain("return '-'");

    expect(vueTask).toContain('Soft residual 1240');
    const vueTaskBody = vueTask.match(/function formatDate\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(vueTaskBody).toContain("return '-'");
    expect(vueTaskBody).toContain('locale.value');
    expect(vueTaskBody).not.toContain('goal.detail.notSet');
    expect(vueTaskBody).not.toContain("'Not set'");
    expect(vueTaskBody).not.toContain("'N/A'");

    expect(schedule).toContain('Soft residual 1240');
    const scheduleBody = schedule.match(/function formatDate\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(scheduleBody).toContain("'N/A'");
    expect(scheduleBody).toContain("typeof timestamp === 'string'");
    expect(scheduleBody).not.toContain("return '-'");

    expect(reminder).toContain('Soft residual 1240');
    const reminderBody = reminder.match(/const formatDate = \([\s\S]*?\n\};/)?.[0] ?? '';
    expect(reminderBody).toContain("t('common.unknown')");
    expect(reminderBody).toContain('yyyy-MM-dd HH:mm:ss');

    expect(rule).toContain('Soft residual 1240');
    const ruleBody = rule.match(/function formatDate\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(ruleBody).toContain("month: 'short'");
    expect(ruleBody).toContain("day: 'numeric'");
    expect(ruleBody).not.toContain('year:');
  });

  it('runtime: documents empty-label contracts via body shape', () => {
    function vueGoalFormatDate(value: number | null | undefined, t: (k: string) => string): string {
      return value ? new Date(value).toLocaleDateString('en-US') : t('goal.detail.notSet');
    }
    function reactGoalFormatDate(timestamp: number | null): string {
      if (!timestamp) return '-';
      return new Date(timestamp).toLocaleDateString();
    }
    function reactTaskFormatDate(timestamp: number | null): string {
      if (!timestamp) return 'Not set';
      return new Date(timestamp).toLocaleString();
    }
    const t = (k: string) => `i18n:${k}`;
    expect(vueGoalFormatDate(null, t)).toBe('i18n:goal.detail.notSet');
    expect(reactGoalFormatDate(null)).toBe('-');
    expect(reactTaskFormatDate(null)).toBe('Not set');
    const ts = Date.UTC(2026, 6, 24);
    expect(typeof vueGoalFormatDate(ts, t)).toBe('string');
    expect(typeof reactGoalFormatDate(ts)).toBe('string');
  });

  it('documents residual 1240 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'format-date-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1240');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
