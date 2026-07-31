import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const managementSource = readFileSync(
  resolve(process.cwd(), 'src/modules/task/views/TaskManagementView.vue'),
  'utf8',
);
const gridSource = readFileSync(
  resolve(process.cwd(), 'src/modules/task/components/TaskTemplateGrid.vue'),
  'utf8',
);

describe('Task single-page architecture', () => {
  it('keeps one primary action and does not branch business capabilities by panel tier', () => {
    expect(managementSource).toContain('data-primary-action="quick-task"');
    expect(managementSource).not.toContain('data-primary-action="create-task-template"');
    expect(managementSource).not.toContain('usePanelWidth');
    expect(managementSource).not.toContain('isNarrow');
    expect(managementSource).not.toContain('task-graph-narrow-hint');
    expect(gridSource).not.toContain('create-first-task-template-button');
    expect(gridSource).not.toContain("'create-template'");
  });

  it('uses one batch operation and one summary toast for delete-all feedback', () => {
    expect(managementSource).toContain('await deleteTemplates(');
    expect(managementSource).toContain("toast.success(t('task.management.allDeleted'))");
    expect(managementSource).not.toContain('for (const template of templates.value)');
  });
});
