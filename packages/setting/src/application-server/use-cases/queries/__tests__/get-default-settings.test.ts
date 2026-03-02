import { describe, it, expect } from 'vitest';
import { getDefaultPreferences } from '@dailyuse/contracts/setting';
import { GetDefaultSettings } from '../get-default-settings';

describe('GetDefaultSettings', () => {
  const useCase = new GetDefaultSettings();

  it('should return default preferences', () => {
    const result = useCase.execute();

    const defaults = getDefaultPreferences();
    expect(result.preferences).toEqual(defaults);
  });

  it('should return a complete client DTO', () => {
    const result = useCase.execute();

    expect(result.id).toBeDefined();
    expect(result.identityId).toBe('defaults');
    expect(result.preferences).toBeDefined();
    expect(result.version).toBe(1);
    expect(typeof result.createdAt).toBe('number');
    expect(typeof result.updatedAt).toBe('number');
  });

  it('should return consistent defaults across calls', () => {
    const result1 = useCase.execute();
    const result2 = useCase.execute();

    expect(result1.preferences).toEqual(result2.preferences);
  });

  it('should return different IDs for each call (new aggregate each time)', () => {
    const result1 = useCase.execute();
    const result2 = useCase.execute();

    expect(result1.id).not.toBe(result2.id);
  });
});
