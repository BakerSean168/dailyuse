import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REPOSITORY_STORAGE_BASE_DIR,
  resolveRepositoryStorageBaseDir,
} from './storage-config';

describe('resolveRepositoryStorageBaseDir', () => {
  it('uses an explicit storageBaseDir before env and trims whitespace', () => {
    expect(
      resolveRepositoryStorageBaseDir({
        storageBaseDir: '  /data/repository  ',
        env: { REPOSITORY_STORAGE_PATH: '/env/repository' },
      }),
    ).toBe('/data/repository');
  });

  it('uses REPOSITORY_STORAGE_PATH when no explicit path is provided', () => {
    expect(
      resolveRepositoryStorageBaseDir({
        env: { REPOSITORY_STORAGE_PATH: '/env/repository' },
      }),
    ).toBe('/env/repository');
  });

  it('falls back to the canonical default for blank or missing values', () => {
    expect(
      resolveRepositoryStorageBaseDir({
        storageBaseDir: ' ',
        env: { REPOSITORY_STORAGE_PATH: '' },
      }),
    ).toBe(DEFAULT_REPOSITORY_STORAGE_BASE_DIR);
  });
});
