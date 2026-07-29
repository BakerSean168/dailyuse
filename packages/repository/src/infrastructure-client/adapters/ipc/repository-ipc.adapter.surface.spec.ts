import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RepositoryChannels } from '@memoflow/contracts/electron';

/**
 * Repository IPC adapter surface (stage-6 residual):
 * Invokes contracts RepositoryChannels only — no string-template dual-track channel names.
 */
describe('RepositoryIpcAdapter channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'repository-ipc.adapter.ts'), 'utf8');

  it('invokes RepositoryChannels and does not hardcode repository: channel strings', () => {
    expect(source).toContain("import { RepositoryChannels } from '@memoflow/contracts/electron'");
    expect(source).not.toContain("private readonly channel = 'repository'");
    expect(source).not.toMatch(/\$\{this\.channel\}/);
    expect(source).toContain('RepositoryChannels.KNOWLEDGE_CONNECTION_LIST');
    expect(source).toContain('RepositoryChannels.LOCAL_VAULT_GET');
    expect(source).toContain('RepositoryChannels.LOCAL_VAULT_NOTE_WRITE_CONFIRMED');
  });

  it('covers live IPC RepositoryChannels used by desktop knowledge/local vault', () => {
    for (const key of [
      'KNOWLEDGE_CONNECTION_INSTALLATION_START',
      'KNOWLEDGE_CONNECTION_SYNC',
      'LOCAL_VAULT_SCAN',
      'LOCAL_VAULT_NOTE_WRITE_CONFIRMED',
    ] as const) {
      expect(source).toContain(`RepositoryChannels.${key}`);
      expect(RepositoryChannels[key]).toMatch(/^repository:/);
    }
  });
});
