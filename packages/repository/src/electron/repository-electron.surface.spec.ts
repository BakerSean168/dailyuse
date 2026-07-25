import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { RepositoryChannels } from '@dailyuse/contracts/electron';

/**
 * Repository electron seam surface (stage-6 residual):
 * Channel registration must use contracts RepositoryChannels only — no dual-track local Ch map.
 */
describe('RepositoryElectronModule channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'index.ts'), 'utf8');

  it('registers handlers via RepositoryChannels and does not redefine a local Ch map', () => {
    expect(source).toContain('RepositoryChannels');
    expect(source).toContain("from '@dailyuse/contracts/electron'");
    expect(source).not.toMatch(/const Ch = \{/);
    expect(source).toContain('Object.values(RepositoryChannels)');
    expect(source).toContain('RepositoryChannels.KNOWLEDGE_CONNECTION_LIST');
    expect(source).toContain('RepositoryChannels.LOCAL_VAULT_GET');
    expect(source).toContain('RepositoryChannels.LOCAL_VAULT_NOTE_WRITE_CONFIRMED');
  });

  it('keeps knowledge-connection and local-vault live channels stable', () => {
    expect(RepositoryChannels.KNOWLEDGE_CONNECTION_SYNC).toBe(
      'repository:knowledge-connection:sync',
    );
    expect(RepositoryChannels.LOCAL_VAULT_NOTE_WRITE_CONFIRMED).toBe(
      'repository:local-vault:note:write-confirmed',
    );
  });
});
