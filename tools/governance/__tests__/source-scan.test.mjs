import { describe, it, expect } from 'vitest';
import { findPatternMatches, stripCommentsStateful } from '../lib/source-scan.mjs';

describe('stripCommentsStateful', () => {
  it('strips line comments', () => {
    expect(stripCommentsStateful('const a = 1; // trailing', false).code).toBe('const a = 1; ');
  });

  it('threads block-comment state across lines', () => {
    const first = stripCommentsStateful('code /* start', false);
    expect(first.inBlockComment).toBe(true);
    expect(first.code).toBe('code ');
    const second = stripCommentsStateful('still comment', true);
    expect(second.inBlockComment).toBe(true);
    expect(second.code).toBe('');
    const third = stripCommentsStateful('end */ tail', true);
    expect(third.inBlockComment).toBe(false);
    expect(third.code).toBe(' tail');
  });
});

describe('findPatternMatches', () => {
  const pattern = /\bfoo\.(bar|baz)\s*\(/;

  it('reports line and captured method for real code', () => {
    const content = 'line one\nfoo.bar(1)\nfoo.baz(2)';
    const matches = findPatternMatches(content, pattern);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toMatchObject({ line: 2, method: 'bar' });
    expect(matches[1]).toMatchObject({ line: 3, method: 'baz' });
  });

  it('skips matches inside comments', () => {
    const content = '// foo.bar(1)\n/* foo.baz(2) */\nconst ok = 1;';
    expect(findPatternMatches(content, pattern)).toHaveLength(0);
  });
});
