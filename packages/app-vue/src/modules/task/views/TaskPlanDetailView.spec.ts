import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const source = fs.readFileSync(path.resolve(__dirname, 'TaskPlanDetailView.vue'), 'utf8');

describe('TaskPlanDetailView TASK-5203', () => {
  it('keeps recurrence/lifecycle management in the secondary plan surface', () => {
    expect(source).toContain('task-plan-detail-view');
    expect(source).toContain('task-plan-completion');
    expect(source).toContain('task-plan-next-occurrence');
    expect(source).toContain('task-plan-outcome');
    expect(source).toContain('task-plan-empty-occurrences');
    expect(source).toContain('task-plan-not-found');
    expect(source).toContain('@2xl/panel:px-6');
    expect(source).toContain('pauseTemplateSafe');
    expect(source).toContain('activateTemplateSafe');
    expect(source).toContain('abandonPlanSafe');
    expect(source).toContain('TaskTemplateDialog');
    expect(source).toContain("name: 'task-occurrence-detail'");
  });

  it('updates through the vNext editor payload rather than retired task metadata', () => {
    expect(source).toContain('labelIds: vm.labelIds ?? []');
    expect(source).toContain('checklist:');
    expect(source).toContain('reminderConfig:');
    expect(source).not.toContain('tags: vm.tags');
    expect(source).not.toContain('color: vm.color');
    expect(source).not.toContain('parentTaskId');
  });
});
