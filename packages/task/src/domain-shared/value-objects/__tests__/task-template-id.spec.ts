import { describe, expect, it } from 'vitest';
import { TaskTemplateId } from '../task-template-id';

describe('TaskTemplateId', () => {
  it('round-trips generated ids through the runtime guard', () => {
    const value = TaskTemplateId.generate();

    expect(TaskTemplateId.is(value)).toBe(true);
    expect(TaskTemplateId.of(value)).toBe(value);
  });
});
