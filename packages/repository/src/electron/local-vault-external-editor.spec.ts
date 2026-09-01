import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LocalVaultRuntime,
  LocalVaultRuntimeError,
  type LocalVaultPlatform,
} from './local-vault-runtime';

/**
 * External Editor characterization tests.
 *
 * Locks the current "open in external editor (Obsidian)" capability —
 * `LocalVaultRuntime.openInObsidian` delegating to the `LocalVaultPlatform`
 * `openExternal` port (`ExternalEditorPort`) — so the capability ownership
 * migration cannot change it silently.
 */
describe('LocalVaultRuntime external editor (openInObsidian)', () => {
  let root: string;
  let vault: string;
  let platform: LocalVaultPlatform;
  let runtime: LocalVaultRuntime;

  beforeEach(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'memoflow-external-editor-'));
    vault = path.join(root, 'My Vault');
    await fs.promises.mkdir(vault, { recursive: true });
    platform = {
      selectDirectory: vi.fn(async () => vault),
      openExternal: vi.fn(async () => undefined),
    };
    runtime = new LocalVaultRuntime({
      bindingFilePath: path.join(root, 'profile', 'local-vault-binding.json'),
      writeLedgerFilePath: path.join(root, 'profile', 'local-vault-write-ledger.json'),
      platform,
      now: () => 1_750_000_000_000,
    });
  });

  afterEach(async () => {
    await fs.promises.rm(root, { recursive: true, force: true });
  });

  async function selectVault(identityId = 'identity-1'): Promise<void> {
    const binding = await runtime.selectVault(identityId);
    expect(binding?.status).toBe('Active');
  }

  function externalUri(): string {
    return vi.mocked(platform.openExternal).mock.calls[0]?.[0] ?? '';
  }

  it('opens the vault root when no note path is requested', async () => {
    await selectVault();
    await runtime.openInObsidian('identity-1', {});
    const uri = externalUri();
    expect(uri.startsWith('obsidian://open?path=')).toBe(true);
    expect(new URL(uri).searchParams.get('path')).toBe(await fs.promises.realpath(vault));
  });

  it('opens a note at its canonical path, percent-encoding the URI', async () => {
    await selectVault();
    await fs.promises.mkdir(path.join(vault, 'Agent'), { recursive: true });
    const notePath = path.join(vault, 'Agent', 'My note.md');
    await fs.promises.writeFile(notePath, '# My note');

    await runtime.openInObsidian('identity-1', { relativePath: 'Agent/My note.md' });
    const uri = externalUri();
    expect(uri).toContain('obsidian://open?path=');
    expect(new URL(uri).searchParams.get('path')).toBe(await fs.promises.realpath(notePath));
  });

  it('throws NOT_FOUND when no vault is selected', async () => {
    await expect(runtime.openInObsidian('identity-1', {})).rejects.toMatchObject<
      Partial<LocalVaultRuntimeError>
    >({ code: 'NOT_FOUND' });
    expect(platform.openExternal).not.toHaveBeenCalled();
  });

  it('rejects a non-Markdown note path before opening', async () => {
    await selectVault();
    await expect(
      runtime.openInObsidian('identity-1', { relativePath: 'notes/todo.txt' }),
    ).rejects.toMatchObject<Partial<LocalVaultRuntimeError>>({ code: 'VALIDATION_ERROR' });
    expect(platform.openExternal).not.toHaveBeenCalled();
  });

  it('rejects an absolute note path before opening', async () => {
    await selectVault();
    await expect(
      runtime.openInObsidian('identity-1', { relativePath: '/etc/passwd.md' }),
    ).rejects.toMatchObject<Partial<LocalVaultRuntimeError>>({ code: 'VALIDATION_ERROR' });
    expect(platform.openExternal).not.toHaveBeenCalled();
  });

  it('rejects a note path that escapes the vault', async () => {
    await selectVault();
    await expect(
      runtime.openInObsidian('identity-1', { relativePath: '../escape.md' }),
    ).rejects.toMatchObject<Partial<LocalVaultRuntimeError>>({ code: 'VALIDATION_ERROR' });
    expect(platform.openExternal).not.toHaveBeenCalled();
  });

  it('rejects a symlink that escapes the vault', async () => {
    await selectVault();
    const outside = path.join(root, 'outside.md');
    await fs.promises.writeFile(outside, '# outside');
    await fs.promises.symlink(outside, path.join(vault, 'escape.md'));

    await expect(
      runtime.openInObsidian('identity-1', { relativePath: 'escape.md' }),
    ).rejects.toMatchObject<Partial<LocalVaultRuntimeError>>({ code: 'FORBIDDEN' });
    expect(platform.openExternal).not.toHaveBeenCalled();
  });

  it('throws NOT_FOUND when the requested note does not exist', async () => {
    await selectVault();
    await expect(
      runtime.openInObsidian('identity-1', { relativePath: 'missing.md' }),
    ).rejects.toMatchObject<Partial<LocalVaultRuntimeError>>({ code: 'NOT_FOUND' });
    expect(platform.openExternal).not.toHaveBeenCalled();
  });
});