import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkLocalImageFreshness } from './image-freshness.mjs';

describe('checkLocalImageFreshness', () => {
  it('emits a warning when image revision differs from HEAD', () => {
    const result = checkLocalImageFreshness('/repo', {
      images: ['memoflow-api:local'],
      runCommand: (command, args) => {
        if (command === 'git') {
          return { exitCode: 0, stdout: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n', stderr: '' };
        }
        if (command === 'docker') {
          return { exitCode: 0, stdout: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb\n', stderr: '' };
        }
        return { exitCode: 1, stdout: '', stderr: 'unknown' };
      },
    });
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0], /lags HEAD/);
    assert.equal(result.comparisons[0].matches, false);
  });

  it('is quiet when image revision matches HEAD', () => {
    const sha = 'cccccccccccccccccccccccccccccccccccccccc';
    const result = checkLocalImageFreshness('/repo', {
      images: ['memoflow-web:local'],
      runCommand: (command) => {
        if (command === 'git') return { exitCode: 0, stdout: `${sha}\n`, stderr: '' };
        return { exitCode: 0, stdout: `${sha}-dirty\n`, stderr: '' };
      },
    });
    assert.deepEqual(result.warnings, []);
    assert.equal(result.comparisons[0].matches, true);
  });

  it('skips missing images without failing', () => {
    const result = checkLocalImageFreshness('/repo', {
      images: ['missing:local'],
      runCommand: (command) => {
        if (command === 'git') {
          return { exitCode: 0, stdout: 'dddddddddddddddddddddddddddddddddddddddd\n', stderr: '' };
        }
        return { exitCode: 1, stdout: '', stderr: 'No such image' };
      },
    });
    assert.equal(result.comparisons[0].imageRevision, null);
    assert.deepEqual(result.warnings, []);
  });
});
