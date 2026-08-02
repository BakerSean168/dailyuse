import { describe, expect, it, vi } from 'vitest';
import {
  TASK_GOAL_BINDING_CONSTRAINT,
  ensureTaskGoalBindingConstraint,
} from './task-goal-binding-constraint';

describe('ensureTaskGoalBindingConstraint', () => {
  it('adds the complete binding check when task_templates exists', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce({ rows: [{ regclass: 'task_templates' }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: null });

    await expect(ensureTaskGoalBindingConstraint({ query })).resolves.toEqual({
      tablePresent: true,
      constraintCreated: true,
    });

    expect(query.mock.calls[2]?.[0]).toContain(`ADD CONSTRAINT "${TASK_GOAL_BINDING_CONSTRAINT}"`);
    expect(query.mock.calls[2]?.[0]).toContain('goal_id IS NULL');
    expect(query.mock.calls[2]?.[0]).toContain('goal_progress_trigger IS NOT NULL');
  });

  it('does nothing when the table is absent', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ regclass: null }], rowCount: 1 });

    await expect(ensureTaskGoalBindingConstraint({ query })).resolves.toEqual({
      tablePresent: false,
      constraintCreated: false,
    });
    expect(query).toHaveBeenCalledTimes(1);
  });
});
