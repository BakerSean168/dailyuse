import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildObsidianUri, resolvePathInsideVault } from './vault-path';

describe('vault-path', () => {
  it('builds obsidian open URIs', () => {
    expect(buildObsidianUri({ vaultName: 'Notes', filePath: 'Inbox/a.md' })).toBe(
      'obsidian://open?vault=Notes&file=Inbox%2Fa.md',
    );
  });

  it('resolves paths inside the vault root', () => {
    const root = path.join('/tmp', 'vault-root');
    const resolved = resolvePathInsideVault(root, 'folder/note.md');
    expect(resolved).toBe(path.join(root, 'folder', 'note.md'));
  });

  it('rejects path traversal outside the vault root', () => {
    const root = path.join('/tmp', 'vault-root');
    expect(() => resolvePathInsideVault(root, '../secret.txt')).toThrow(/escapes vault root/);
  });
});
