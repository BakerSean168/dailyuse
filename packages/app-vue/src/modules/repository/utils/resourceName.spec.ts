import { describe, expect, it } from 'vitest';
import { __test__, getEditableResourceName, normalizeRenamedResourceName } from './resourceName';

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

  it('strips the current extension for dialog editing', () => {
    expect(getEditableResourceName({ name: 'Old Note.md', extension: '.md' })).toBe('Old Note');
  });

  it('preserves multi-dot basenames when stripping the current extension', () => {
    expect(getEditableResourceName({ name: 'archive.tar.gz', extension: '.gz' })).toBe(
      'archive.tar',
    );
  });

  it('leaves names without an extension unchanged', () => {
    expect(getEditableResourceName({ name: 'README', extension: '' })).toBe('README');
  });

  it('detects names that already contain an extension', () => {
    expect(__test__.hasExtension('example.png')).toBe(true);
    expect(__test__.hasExtension('example')).toBe(false);
  });
});
