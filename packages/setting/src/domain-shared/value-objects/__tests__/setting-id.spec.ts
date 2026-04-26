import { describe, expect, it } from 'vitest';
import { SettingId } from '../setting-id';

describe('SettingId', () => {
  it('round-trips generated ids through the runtime guard', () => {
    const value = SettingId.generate();

    expect(SettingId.is(value)).toBe(true);
    expect(SettingId.of(value)).toBe(value);
  });
});
