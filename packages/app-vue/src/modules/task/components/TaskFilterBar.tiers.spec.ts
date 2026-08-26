import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const management = readFileSync(resolve(__dirname, '../views/TaskManagementView.vue'), 'utf8');

describe('Task management flat presentation', () => {
  it('keeps one search input and one canonical create action without a retired filter/graph surface', () => {
    expect(management).toContain('v-model="searchQuery"');
    expect(management).toContain('data-testid="create-task-entry"');
    expect(management).toContain('data-primary-action="create-task"');
    expect(management).not.toContain('TaskFilterBar');
    expect(management).not.toContain('TaskDAG');
    expect(management).not.toContain('usePanelWidth');
  });
});
