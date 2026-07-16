import { describe, expect, it } from 'vitest';
import { normalizeCrudData } from './crud-normalization';

describe('normalizeCrudData', () => {
  it('decodes PowerSync JSON text for Prisma scalar-list fields', () => {
    expect(normalizeCrudData('goals', { tags: '["work","focus"]' })).toEqual({
      tags: ['work', 'focus'],
    });
    expect(
      normalizeCrudData('focus_modes', {
        focused_goal_ids: '["goal-1","goal-2"]',
      }),
    ).toEqual({ focusedGoalIds: ['goal-1', 'goal-2'] });
  });

  it('keeps JSON-looking text when the Prisma column is intentionally a string', () => {
    expect(normalizeCrudData('task_templates', { tags: '["work"]' })).toEqual({
      tags: '["work"]',
    });
  });

  it('keeps malformed JSON unchanged instead of corrupting an upload batch', () => {
    expect(normalizeCrudData('goals', { tags: '[invalid]' })).toEqual({
      tags: '[invalid]',
    });
  });
});
