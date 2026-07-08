import { describe, expect, it } from 'vitest';
import { ResourceLanguage } from '../resource-language';

describe('ResourceLanguage', () => {
  it('validates type', () => {
    expect(ResourceLanguage.isValid('Markdown')).toBe(true);
    expect(ResourceLanguage.isValid('Invalid')).toBe(false);
  });

  it('creates type of valid value', () => {
    expect(ResourceLanguage.of('Html')).toBe('Html');
  });

  it('throws on invalid value', () => {
    expect(() => ResourceLanguage.of('Invalid')).toThrow();
  });

  it('gets all types', () => {
    expect(ResourceLanguage.getAll()).toEqual([
      'Markdown',
      'Plaintext',
      'Html',
      'Json',
      'Typescript',
      'Javascript',
      'Python',
      'Java',
      'Go',
      'Rust',
      'Other',
    ]);
  });

  it('checks type category', () => {
    expect(ResourceLanguage.isMarkdown(ResourceLanguage.Markdown)).toBe(true);
    expect(ResourceLanguage.isMarkdown(ResourceLanguage.Python)).toBe(false);
    expect(ResourceLanguage.isCode(ResourceLanguage.Python)).toBe(true);
    expect(ResourceLanguage.isCode(ResourceLanguage.Java)).toBe(true);
    expect(ResourceLanguage.isCode(ResourceLanguage.Markdown)).toBe(false);
  });
});
