import { describe, expect, it } from 'vitest';
import { LinkedTargetType } from '../linked-target-type';

describe('LinkedTargetType', () => {
  it('validates type', () => {
    expect(LinkedTargetType.isValid('Resource')).toBe(true);
    expect(LinkedTargetType.isValid('Invalid')).toBe(false);
  });

  it('creates type of valid value', () => {
    expect(LinkedTargetType.of('Image')).toBe('Image');
  });

  it('throws on invalid value', () => {
    expect(() => LinkedTargetType.of('Invalid')).toThrow();
  });

  it('gets all types', () => {
    expect(LinkedTargetType.getAll()).toEqual([
      'Resource',
      'Image',
      'Video',
      'Audio',
      'Archive',
      'ExternalUrl',
      'Anchor',
    ]);
  });

  it('checks type category', () => {
    expect(LinkedTargetType.isMedia(LinkedTargetType.Image)).toBe(true);
    expect(LinkedTargetType.isMedia(LinkedTargetType.Video)).toBe(true);
    expect(LinkedTargetType.isMedia(LinkedTargetType.Audio)).toBe(true);
    expect(LinkedTargetType.isMedia(LinkedTargetType.Resource)).toBe(false);
    expect(LinkedTargetType.isLocal(LinkedTargetType.ExternalUrl)).toBe(false);
    expect(LinkedTargetType.isLocal(LinkedTargetType.Resource)).toBe(true);
  });
});
