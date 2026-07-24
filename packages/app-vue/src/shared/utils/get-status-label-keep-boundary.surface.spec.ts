import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1222: getStatusLabel keep-boundary (schedule typed i18n vs goal domain i18n vs react English).
 * - app-vue schedule-presentation: ScheduleTaskStatus → schedule.taskStatus.* (t first arg)
 * - app-vue GoalDetailView: Draft/Active/Completed/Archived → goal.cards.goalStatus.*
 * - app-react GoalCompareScreen: Draft/… → English identity strings (no t())
 * Soft residual 1222: GoalCard local same goal map (no force-extract).
 * Soft residual 1219: getImportanceLabel keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('getStatusLabel keep-boundary (residual 1222)', () => {
  const dir = __dirname;
  const schedule = readFileSync(
    resolve(dir, '../../modules/schedule/utils/schedule-presentation.ts'),
    'utf8',
  );
  const vueGoal = readFileSync(
    resolve(dir, '../../modules/goal/views/GoalDetailView.vue'),
    'utf8',
  );
  const goalCard = readFileSync(
    resolve(dir, '../../modules/goal/components/cards/GoalCard.vue'),
    'utf8',
  );
  const react = readFileSync(
    resolve(dir, '../../../../app-react/src/screens/GoalCompareScreen.tsx'),
    'utf8',
  );

  it('owns Residual 1222 keep-boundary markers on schedule typed getStatusLabel', () => {
    expect(schedule).toContain('Residual 1222 keep-boundary');
    expect(schedule).toMatch(/export function getStatusLabel\b/);
    expect(schedule).toContain('ScheduleTaskStatus');
    expect(schedule).toContain('schedule.taskStatus.active');
    expect(schedule).toContain('schedule.taskStatus.paused');
    expect(schedule).toContain('schedule.taskStatus.failed');
    expect(schedule).toContain('schedule.taskStatus.cancelled');
    const body = schedule.match(/export function getStatusLabel\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('Paused');
    expect(body).toContain('Failed');
    expect(body).not.toContain('goal.cards.goalStatus');
    expect(body).not.toContain("Draft: 'Draft'");
    expect(body).not.toContain('Archived');
  });

  it('differs from app-vue goal domain getStatusLabel (no force-merge)', () => {
    expect(vueGoal).toContain('Residual 1222 keep-boundary');
    expect(vueGoal).toMatch(/function getStatusLabel\b/);
    expect(vueGoal).toContain("t('goal.cards.goalStatus.active')");
    expect(vueGoal).toContain("t('goal.cards.goalStatus.draft')");
    expect(vueGoal).toContain("t('goal.cards.goalStatus.archived')");
    const body = vueGoal.match(/function getStatusLabel\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('Draft');
    expect(body).toContain('Archived');
    expect(body).toContain('goal.cards.goalStatus');
    expect(body).not.toContain('schedule.taskStatus');
    expect(body).not.toContain('Paused');
    expect(body).not.toContain("Draft: 'Draft'");
  });

  it('differs from app-react English identity getStatusLabel (no force-merge)', () => {
    expect(react).toContain('Residual 1222 keep-boundary');
    expect(react).toMatch(/function getStatusLabel\b/);
    expect(react).toContain('Soft residual 1222');
    expect(react).toContain("Draft: 'Draft'");
    expect(react).toContain("Archived: 'Archived'");
    const body = react.match(/function getStatusLabel\([\s\S]*?\n  \}/)?.[0] ?? '';
    expect(body).toContain("'Active'");
    expect(body).not.toContain('goal.cards.goalStatus');
    expect(body).not.toContain('schedule.taskStatus');
    expect(body).not.toMatch(/\bt\(/);
    expect(body).not.toContain('Paused');
  });

  it('soft residual 1222 GoalCard local same goal map stays package-local', () => {
    expect(goalCard).toContain('Soft residual 1222');
    expect(goalCard).toMatch(/const getStatusLabel\b/);
    expect(goalCard).toContain("t('goal.cards.goalStatus.active')");
    expect(goalCard).toContain("t('goal.cards.goalStatus.draft')");
    expect(goalCard).not.toContain('schedule.taskStatus');
    expect(goalCard).not.toContain("Draft: 'Draft'");
  });

  it('runtime: documents schedule vs goal i18n vs English identity contracts via body shape', () => {
    function scheduleGetStatusLabel(
      status: string,
      t: (k: string) => string,
    ): string {
      const keyMap: Record<string, string> = {
        Active: 'schedule.taskStatus.active',
        Paused: 'schedule.taskStatus.paused',
        Completed: 'schedule.taskStatus.completed',
        Failed: 'schedule.taskStatus.failed',
        Cancelled: 'schedule.taskStatus.cancelled',
      };
      return t(keyMap[status] ?? status);
    }
    function vueGoalGetStatusLabel(status: string, t: (k: string) => string): string {
      const labels: Record<string, string> = {
        Active: t('goal.cards.goalStatus.active'),
        Completed: t('goal.cards.goalStatus.completed'),
        Archived: t('goal.cards.goalStatus.archived'),
        Draft: t('goal.cards.goalStatus.draft'),
      };
      return labels[status] ?? status;
    }
    function reactGetStatusLabel(status: string): string {
      const labels: Record<string, string> = {
        Draft: 'Draft',
        Active: 'Active',
        Completed: 'Completed',
        Archived: 'Archived',
      };
      return labels[status] ?? status;
    }
    const t = (k: string) => `i18n:${k}`;
    expect(scheduleGetStatusLabel('Paused', t)).toBe('i18n:schedule.taskStatus.paused');
    expect(vueGoalGetStatusLabel('Draft', t)).toBe('i18n:goal.cards.goalStatus.draft');
    expect(reactGetStatusLabel('Draft')).toBe('Draft');
    expect(scheduleGetStatusLabel('Draft', t)).toBe('i18n:Draft');
    expect(vueGoalGetStatusLabel('Paused', t)).toBe('Paused');
    expect(reactGetStatusLabel('Paused')).toBe('Paused');
  });

  it('documents residual 1222 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'get-status-label-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1222');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
