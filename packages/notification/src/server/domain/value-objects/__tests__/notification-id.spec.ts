import { describe, expect, it } from 'vitest';
import { NotificationId } from '../notification-id';

describe('NotificationId', () => {
  it('round-trips generated ids through the runtime guard', () => {
    const value = NotificationId.generate();

    expect(NotificationId.is(value)).toBe(true);
    expect(NotificationId.of(value)).toBe(value);
  });
});
