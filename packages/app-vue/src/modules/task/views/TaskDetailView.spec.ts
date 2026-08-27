import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve(__dirname, 'TaskDetailView.vue'), 'utf8');

describe('TaskDetailView TASK-5203 occurrence surface', () => {
  it('is occurrence-first and shows execution facts without plan-management controls', () => {
    expect(source).toContain('useTaskOccurrenceDetailQuery');
    expect(source).toContain('task-occurrence-detail');
    expect(source).toContain('task-occurrence-status');
    expect(source).toContain('task-occurrence-overdue');
    expect(source).toContain('task-repeat-position');
    expect(source).toContain('task-occurrence-goal-context');
    expect(source).toContain('@2xl/panel:px-6');
    expect(source).toContain('type="button"');
    expect(source).toContain('task-view-repeat-settings');
    for (const retired of ['TaskDependency', 'CriticalPath', 'parentTaskId', 'dependencyStatus']) {
      expect(source).not.toContain(retired);
    }
    expect(source).not.toContain('TaskTemplateDialog');
    expect(source).not.toContain('pauseTemplateSafe');
    expect(source).not.toContain('abandonPlanSafe');
  });

  it('delegates correction commands to Task occurrence owner mutations', () => {
    expect(source).toContain('completeInstance');
    expect(source).toContain('uncompleteInstance');
    expect(source).toContain('skipInstance');
    expect(source).toContain('markInstanceMissed');
    expect(source).toContain('task-occurrence-complete');
    expect(source).toContain('task-occurrence-uncomplete');
    expect(source).toContain('task-occurrence-missed');
    expect(source).toContain('task-occurrence-skip');
  });
});
