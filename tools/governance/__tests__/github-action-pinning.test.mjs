import { describe, expect, it } from 'vitest';
import {
  findUnpinnedActionUses,
  FULL_COMMIT_SHA,
  VERSION_COMMENT,
} from '../lib/github-action-pinning.mjs';

const sha = 'a'.repeat(40);

describe('GitHub Action immutable pin contract', () => {
  it('accepts a 40-hex third-party pin with a version comment and local actions', () => {
    const violations = findUnpinnedActionUses({
      file: '.github/workflows/example.yml',
      content: `steps:\n  - uses: actions/checkout@${sha} # v6\n  - uses: ./.github/actions/local\n`,
    });
    expect(violations).toEqual([]);
  });

  it.each(['v6', 'main', 'feature/ref', 'abc123'])(
    'rejects mutable or abbreviated ref %s',
    (ref) => {
      const violations = findUnpinnedActionUses({
        file: '.github/workflows/example.yml',
        content: `steps:\n  - uses: actions/checkout@${ref} # v6\n`,
      });
      expect(violations).toHaveLength(1);
      expect(violations[0]).toMatchObject({ ref, reason: expect.stringContaining('mutable') });
    },
  );

  it('accepts quoted immutable and local uses syntax', () => {
    const violations = findUnpinnedActionUses({
      file: '.github/workflows/example.yml',
      content: `steps:\n  - uses: "actions/checkout@${sha}" # v6\n  - uses: './.github/actions/local'\n`,
    });
    expect(violations).toEqual([]);
  });

  it('requires a human-readable version comment beside an immutable pin', () => {
    const violations = findUnpinnedActionUses({
      file: '.github/actions/example/action.yml',
      content: `runs:\n  steps:\n    - uses: actions/cache@${sha}\n`,
    });
    expect(violations).toHaveLength(1);
    expect(violations[0].reason).toContain('version comment');
  });

  it('rejects non-repository third-party uses syntax instead of silently exempting it', () => {
    const violations = findUnpinnedActionUses({
      file: '.github/workflows/example.yml',
      content: 'steps:\n  - uses: docker://alpine:3.20\n',
    });
    expect(violations).toHaveLength(1);
    expect(violations[0].reason).toContain('owner/repository');
  });

  it('recognizes only exact lowercase commit and version-comment forms', () => {
    expect(FULL_COMMIT_SHA.test(sha)).toBe(true);
    expect(FULL_COMMIT_SHA.test('A'.repeat(40))).toBe(false);
    expect(VERSION_COMMENT.test('v6')).toBe(true);
    expect(VERSION_COMMENT.test('release-v6')).toBe(false);
  });
});
