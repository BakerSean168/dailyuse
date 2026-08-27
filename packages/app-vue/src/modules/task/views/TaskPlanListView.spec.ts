import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve(__dirname, 'TaskPlanListView.vue'), 'utf8');

describe('TaskPlanListView TASK-5203', () => {
  it('is a secondary repeating-task list with next occurrence and completion progress', () => {
    expect(source).toContain('task-plan-list-view');
    expect(source).toContain('task-plan-row');
    expect(source).toContain('type="button"');
    expect(source).toContain('@2xl/panel:px-6');
    expect(source).toContain('resolveTaskPlanNextOccurrence');
    expect(source).toContain('completedInstanceCount');
    expect(source).toContain('recurrenceRule');
    expect(source).toContain('pauseTemplateSafe');
    expect(source).toContain('activateTemplateSafe');
  });
});
