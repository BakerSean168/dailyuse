import { describe, expect, it } from 'vitest';
import { __test__, normalizeRenamedResourceName } from './resourceName';

describe('resourceName', () => {
  it('preserves the existing extension when omitted', () => {
    expect(
      normalizeRenamedResourceName({ name: 'Old Note.md', extension: '.md' }, 'Renamed Note'),
    ).toBe('Renamed Note.md');
  });

  it('keeps an explicit extension from the user input', () => {
    expect(
      normalizeRenamedResourceName({ name: 'Old Note.md', extension: '.md' }, 'Renamed.txt'),
    ).toBe('Renamed.txt');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeRenamedResourceName({ name: 'Old Note.md', extension: '.md' }, '   ')).toBe('');
  });

  it('detects names that already contain an extension', () => {
    expect(__test__.hasExtension('example.png')).toBe(true);
    expect(__test__.hasExtension('example')).toBe(false);
  });
});
