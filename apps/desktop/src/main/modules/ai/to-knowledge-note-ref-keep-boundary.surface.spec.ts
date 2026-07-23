import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 1149: toKnowledgeNoteRef Desktop local-Vault vs API GitHub keep-boundary.
 * - Desktop: local-vault id/scope prefixes; path-hash id; note.updatedAt timestamps; DTO size
 * - API: knowledge-note id prefix; connectionId scope; Date.now timestamps; Buffer.byteLength size
 * Soft residual 723: KnowledgeNotePersistedRef schema sole remains contracts dual-retired.
 * Does not flip §13.2 checkboxes.
 */
describe('toKnowledgeNoteRef keep-boundary (residual 1149)', () => {
  const dir = __dirname;
  const desktop = readFileSync(
    resolve(dir, 'desktop-knowledge-note-persistence.adapter.ts'),
    'utf8',
  );
  const api = readFileSync(
    resolve(
      dir,
      '../../../../../../apps/api/src/modules/ai/repository-knowledge-note-persistence.adapter.ts',
    ),
    'utf8',
  );

  it('owns Residual 1149 keep-boundary markers on Desktop local-Vault mapping', () => {
    expect(desktop).toContain('Residual 1149 keep-boundary');
    expect(desktop).toMatch(/function toKnowledgeNoteRef\b/);
    expect(desktop).toContain('local-vault-');
    expect(desktop).toContain('LocalVaultNoteDTO');
    expect(desktop).toContain("note.relativePath");
    expect(desktop).toContain('note.updatedAt');
    expect(desktop).toContain('note.size');
    expect(desktop).toContain('.slice(0, 24)');
    const body = desktop.match(/function toKnowledgeNoteRef\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('local-vault-');
    expect(body).not.toContain('knowledge-note-');
    expect(body).not.toContain('Buffer.byteLength');
    expect(body).not.toContain('Date.now()');
  });

  it('differs from API GitHub connection mapping (no force-merge)', () => {
    expect(api).toContain('Soft residual 1149');
    expect(api).toMatch(/function toKnowledgeNoteRef\b/);
    expect(api).toContain('knowledge-note-');
    expect(api).toContain('connectionId');
    expect(api).toContain('Buffer.byteLength');
    expect(api).toContain('Date.now()');
    expect(api).toContain('input.fileName');
    const body = api.match(/function toKnowledgeNoteRef\([\s\S]*?\n\}/)?.[0] ?? '';
    expect(body).toContain('knowledge-note-');
    expect(body).not.toContain('local-vault-');
    expect(body).not.toContain('LocalVaultNoteDTO');
    expect(body).not.toContain('note.updatedAt');
    expect(body).not.toContain('.slice(0, 24)');
  });

  it('documents both require confirmed proposal gates without merging write paths', () => {
    expect(desktop).toContain('local Vault writes');
    expect(desktop).toContain('writeConfirmedNote');
    expect(api).toContain('GitHub writes');
    expect(api).toContain('createConfirmedKnowledgeNote');
    // Desktop must not call GitHub confirmed-create; API must not call localVault
    expect(desktop).not.toContain('createConfirmedKnowledgeNote');
    expect(api).not.toContain('writeConfirmedNote');
    expect(api).not.toContain('LocalVaultElectronPort');
  });

  it('documents residual 1149 lock intent without claiming §13.2 complete', () => {
    const self = readFileSync(
      resolve(dir, 'to-knowledge-note-ref-keep-boundary.surface.spec.ts'),
      'utf8',
    );
    expect(self).toContain('Residual 1149');
    expect(self).toContain('Does not flip §13.2 checkboxes');
    expect(self).toContain('keep-boundary');
  });
});
