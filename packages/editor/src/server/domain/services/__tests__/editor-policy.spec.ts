import { describe, expect, it } from 'vitest';
import { EditorPolicy } from '../editor-policy';

describe('EditorPolicy', () => {
  const policy = new EditorPolicy();

  it('allows file extensions that match case-insensitively', () => {
    expect(() =>
      policy.assertFileTypeAllowed('README.MD', {
        allowedExtensions: ['md', 'txt'],
      }),
    ).not.toThrow();
  });

  it('rejects opening tabs when the configured limit is reached', () => {
    expect(() =>
      policy.assertOpenTabLimit(3, {
        maxOpenTabs: 3,
      }),
    ).toThrow('Maximum open tabs reached');
  });
});
