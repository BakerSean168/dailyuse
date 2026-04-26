import { describe, expect, it } from 'vitest';
import { ReminderTemplateId } from '../reminder-template-id';

describe('ReminderTemplateId', () => {
  it('round-trips generated ids through the runtime guard', () => {
    const value = ReminderTemplateId.generate();

    expect(ReminderTemplateId.is(value)).toBe(true);
    expect(ReminderTemplateId.of(value)).toBe(value);
  });
});
