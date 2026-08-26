import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const managementSource = readFileSync(
  resolve(dirname(fileURLToPath(import.meta.url)), 'TaskManagementView.vue'),
  'utf8',
);

describe('Task vNext single-page presentation', () => {
  it('keeps one create-plan action and no panel-tier business branching', () => {
    expect(managementSource).toContain('data-primary-action="create-task"');
    expect(managementSource).toContain('data-testid="create-task-entry"');
    expect(managementSource).not.toContain('usePanelWidth');
    expect(managementSource).not.toContain('isNarrow');
    expect(managementSource).not.toContain('TaskTemplateGrid');
    expect(managementSource).not.toContain('TaskDAG');
    expect(managementSource).not.toContain('DependencyManager');
  });
});
