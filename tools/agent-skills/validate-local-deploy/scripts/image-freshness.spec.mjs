import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { checkLocalImageFreshness } from './image-freshness.mjs';

describe('checkLocalImageFreshness', () => {
  it('emits a warning when image revision differs from the exact workspace revision', () => {
    const expectedRevision = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-dirty-111111111111';
    const result = checkLocalImageFreshness('/repo', {
      expectedRevision,
      images: ['memoflow-api:local'],
      runCommand: (command) => {
        if (command === 'docker') {
          return {
            exitCode: 0,
            stdout: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb-dirty-222222222222\n',
            stderr: '',
          };
        }
        return { exitCode: 1, stdout: '', stderr: 'unknown' };
      },
    });
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0], /does not match workspace/);
    assert.equal(result.comparisons[0].matches, false);
  });

  it('is quiet when image revision matches the exact dirty fingerprint', () => {
    const revision = 'cccccccccccccccccccccccccccccccccccccccc-dirty-123456789abc';
    const result = checkLocalImageFreshness('/repo', {
      expectedRevision: revision,
      images: ['memoflow-web:local'],
      runCommand: () => ({ exitCode: 0, stdout: `${revision}\n`, stderr: '' }),
    });
    assert.deepEqual(result.warnings, []);
    assert.equal(result.workspaceRevision, revision);
    assert.equal(result.comparisons[0].matches, true);
  });

  it('rejects stale dirty evidence even when both revisions share the same HEAD', () => {
    const head = 'dddddddddddddddddddddddddddddddddddddddd';
    const result = checkLocalImageFreshness('/repo', {
      expectedRevision: `${head}-dirty-newfinger001`,
      images: ['memoflow-api:local'],
      runCommand: () => ({
        exitCode: 0,
        stdout: `${head}-dirty-oldfinger001\n`,
        stderr: '',
      }),
    });
    assert.equal(result.comparisons[0].matches, false);
    assert.equal(result.warnings.length, 1);
  });

  it('skips missing images without failing', () => {
    const result = checkLocalImageFreshness('/repo', {
      expectedRevision: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      images: ['missing:local'],
      runCommand: () => ({ exitCode: 1, stdout: '', stderr: 'No such image' }),
    });
    assert.equal(result.comparisons[0].imageRevision, null);
    assert.deepEqual(result.warnings, []);
  });
});
