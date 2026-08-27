import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('TaskManagementView TASK-5201', () => {
  it('is an occurrence-first Today/Upcoming execution surface rather than template management', () => {
    const source = fs.readFileSync(path.resolve(__dirname, 'TaskManagementView.vue'), 'utf8');

    expect(source).toContain('task-management-view');
    expect(source).toContain('task-occurrence-row');
    expect(source).toContain("'today'");
    expect(source).toContain("'upcoming'");
    expect(source).toContain("'completed'");
    expect(source).toContain('LabelFilterPopover');
    expect(source).toContain('selectedGoalId');
    expect(source).toContain('selectedKeyResultId');
    expect(source).not.toContain('task-plan-card');
    expect(source).not.toContain('TaskDAG');
    expect(source).not.toContain('Dependency');
  });

  it('keeps only one canonical create action and delegates occurrence commands to useTaskInstances', () => {
    const source = fs.readFileSync(path.resolve(__dirname, 'TaskManagementView.vue'), 'utf8');

    expect(source.match(/data-primary-action="create-task"/g)).toHaveLength(1);
    expect(source).toContain('useTaskInstances');
    expect(source).toContain('completeInstance');
    expect(source).toContain('uncompleteInstance');
  });
});
