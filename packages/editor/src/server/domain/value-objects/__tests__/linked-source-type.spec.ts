import { describe, expect, it } from 'vitest';
import { LinkedSourceType } from '../linked-source-type';

describe('LinkedSourceType', () => {
  it('validates type', () => {
    expect(LinkedSourceType.isValid('MarkdownLink')).toBe(true);
    expect(LinkedSourceType.isValid('Invalid')).toBe(false);
  });

  it('creates type of valid value', () => {
    expect(LinkedSourceType.of('WikiLink')).toBe('WikiLink');
  });

  it('throws on invalid value', () => {
    expect(() => LinkedSourceType.of('Invalid')).toThrow();
  });

  it('gets all types', () => {
    expect(LinkedSourceType.getAll()).toEqual([
      'MarkdownLink',
      'MarkdownImage',
      'HtmlAnchor',
      'HtmlImage',
      'WikiLink',
      'Reference',
    ]);
  });

  it('checks type category', () => {
    expect(LinkedSourceType.isMarkdown(LinkedSourceType.MarkdownLink)).toBe(true);
    expect(LinkedSourceType.isMarkdown(LinkedSourceType.MarkdownImage)).toBe(true);
    expect(LinkedSourceType.isMarkdown(LinkedSourceType.HtmlAnchor)).toBe(false);
    expect(LinkedSourceType.isImage(LinkedSourceType.MarkdownImage)).toBe(true);
    expect(LinkedSourceType.isImage(LinkedSourceType.HtmlImage)).toBe(true);
    expect(LinkedSourceType.isImage(LinkedSourceType.MarkdownLink)).toBe(false);
  });
});
