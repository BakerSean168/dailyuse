import { describe, expect, it } from 'vitest';
import { checkLocalImageFreshness } from './image-freshness.mjs';

describe('checkLocalImageFreshness', () => {
  it('emits a warning when image revision differs from HEAD', () => {
    const result = checkLocalImageFreshness('/repo', {
      images: ['dailyuse-api:local'],
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
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]).toMatch(/lags HEAD/);
    expect(result.comparisons[0].matches).toBe(false);
  });

  it('is quiet when image revision matches HEAD', () => {
    const sha = 'cccccccccccccccccccccccccccccccccccccccc';
    const result = checkLocalImageFreshness('/repo', {
      images: ['dailyuse-web:local'],
      runCommand: (command) => {
        if (command === 'git') return { exitCode: 0, stdout: `${sha}\n`, stderr: '' };
        return { exitCode: 0, stdout: `${sha}-dirty\n`, stderr: '' };
      },
    });
    expect(result.warnings).toEqual([]);
    expect(result.comparisons[0].matches).toBe(true);
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
    expect(result.comparisons[0].imageRevision).toBeNull();
    expect(result.warnings).toEqual([]);
  });
});
