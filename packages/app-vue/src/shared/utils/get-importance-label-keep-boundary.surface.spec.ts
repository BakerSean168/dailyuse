import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('GOAL-2101 importance presentation retirement', () => {
  const dir = __dirname;
  const goalDetail = readFileSync(resolve(dir, '../../modules/goal/views/GoalDetailView.vue'), 'utf8');
  const goalCard = readFileSync(resolve(dir, '../../modules/goal/components/cards/GoalCard.vue'), 'utf8');
  const goalDialog = readFileSync(resolve(dir, '../../modules/goal/components/dialogs/GoalDialog.vue'), 'utf8');
  const krPreview = readFileSync(resolve(dir, '../../modules/goal/components/KRPreviewList.vue'), 'utf8');

  it('does not restore Goal business importance or a Goal importance label mapper', () => {
    for (const source of [goalDetail, goalCard, goalDialog]) {
      expect(source).not.toMatch(/getImportanceLabel\b/);
      expect(source).not.toContain('importanceVital');
      expect(source).not.toContain('goal.importance');
    }
  });

  it('does not confuse the retired Goal field with KR preview importance copy', () => {
    expect(krPreview).toContain('goal.krPreview.importance');
    expect(krPreview).not.toContain('importanceVital');
  });
});
