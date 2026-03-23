import { describe, expect, it } from 'vitest';
import { __test__ } from './markdownLivePreview';

describe('markdownLivePreview', () => {
  it('finds fenced code block ranges from markdown text', () => {
    expect(
      __test__.findFencedCodeBlocksFromText([
        '# Note',
        '```ts',
        'const answer = 42;',
        '```',
        '',
        '~~~sql',
        'select * from notes;',
        '~~~',
      ].join('\n')),
    ).toEqual([
      {
        startLine: 2,
        endLine: 4,
        language: 'ts',
        codeFrom: 13,
        codeTo: 31,
      },
      {
        startLine: 6,
        endLine: 8,
        language: 'sql',
        codeFrom: 44,
        codeTo: 64,
      },
    ]);
  });
});
