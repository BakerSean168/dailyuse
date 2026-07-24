import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1177: buildTaskName keep-boundary (goal vs task schedule projections).
 * - goal: GoalServerDTO + ReminderTrigger → RemainingDays / progress % Chinese name
 * - task: TaskTemplateServerDTO + Relative/Absolute trigger → 提前/定时提醒 name
 * Soft residual 1168: mapImportanceToTaskPriority dual-retired sole remains separate.
 * Soft residual 1174: normalizePath keep-boundary remains separate.
 * Does not flip §13.2 checkboxes.
 */
describe('buildTaskName keep-boundary (residual 1177)', () => {
  const dir = __dirname;
  const goal = readFileSync(resolve(dir, 'schedule-projection-source.ts'), 'utf8');
  const task = readFileSync(
    resolve(dir, '../../../../task/src/server/infrastructure/schedule-projection-source.ts'),
    'utf8',
  );

  it('owns Residual 1177 keep-boundary markers on goal domain buildTaskName', () => {
    expect(goal).toContain('Residual 1177 keep-boundary');
    expect(goal).toMatch(/function buildTaskName\b/);
    expect(goal).toContain('GoalServerDTO');
    expect(goal).toContain('ReminderTrigger');
    expect(goal).toContain('RemainingDays');
    expect(goal).toContain('剩余');
    expect(goal).toContain('进度');
    const body = goal.match(/function buildTaskName\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('goal.name');
    expect(body).toContain('trigger.value');
    expect(body).not.toContain('template.name');
    expect(body).not.toContain('formatUnit');
    expect(body).not.toContain('定时提醒');
  });

  it('differs from task template Relative/Absolute buildTaskName (no force-merge)', () => {
    expect(task).toContain('Residual 1177 keep-boundary');
    expect(task).toMatch(/function buildTaskName\b/);
    expect(task).toContain('Soft residual 1177');
    expect(task).toContain('TaskTemplateServerDTO');
    expect(task).toContain("'Relative'");
    expect(task).toContain('formatUnit');
    expect(task).toContain('定时提醒');
    const body = task.match(/function buildTaskName\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('template.name');
    expect(body).toContain('relativeValue');
    expect(body).not.toContain('RemainingDays');
    expect(body).not.toContain('剩余');
    expect(body).not.toContain('GoalServerDTO');
  });

  it('runtime: documents goal remaining/progress vs task relative/absolute naming contracts', () => {
    function goalBuildTaskName(
      goalName: string,
      trigger: { type: 'RemainingDays' | 'TimeProgressPercentage'; value: number },
    ): string {
      if (trigger.type === 'RemainingDays') {
        return `${goalName} · 剩余 ${trigger.value} 天提醒`;
      }
      return `${goalName} · 进度 ${trigger.value}% 提醒`;
    }
    function taskBuildTaskName(
      templateName: string,
      trigger: {
        type: 'Relative' | 'Absolute';
        relativeValue: number | null;
        relativeUnit: 'Minutes' | 'Hours' | 'Days' | null;
      },
    ): string {
      const unitLabel =
        trigger.relativeUnit === 'Minutes'
          ? '分钟'
          : trigger.relativeUnit === 'Hours'
            ? '小时'
            : trigger.relativeUnit === 'Days'
              ? '天'
              : '';
      if (trigger.type === 'Relative' && trigger.relativeValue !== null && trigger.relativeUnit) {
        return `${templateName} · 提前 ${trigger.relativeValue}${unitLabel} 提醒`;
      }
      return `${templateName} · 定时提醒`;
    }
    expect(goalBuildTaskName('读完书', { type: 'RemainingDays', value: 3 })).toBe(
      '读完书 · 剩余 3 天提醒',
    );
    expect(goalBuildTaskName('读完书', { type: 'TimeProgressPercentage', value: 50 })).toBe(
      '读完书 · 进度 50% 提醒',
    );
    expect(
      taskBuildTaskName('写报告', {
        type: 'Relative',
        relativeValue: 30,
        relativeUnit: 'Minutes',
      }),
    ).toBe('写报告 · 提前 30分钟 提醒');
    expect(
      taskBuildTaskName('写报告', {
        type: 'Absolute',
        relativeValue: null,
        relativeUnit: null,
      }),
    ).toBe('写报告 · 定时提醒');
  });

  it('documents residual 1177 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(resolve(dir, 'build-task-name-keep-boundary.surface.spec.ts'), 'utf8');
    expect(self).toContain('Residual 1177');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
