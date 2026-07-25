import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LocalVaultRuntime,
  LocalVaultRuntimeError,
  type LocalVaultPlatform,
} from './local-vault-runtime';

describe('LocalVaultRuntime', () => {
  let root: string;
  let vault: string;
  let platform: LocalVaultPlatform;
  let runtime: LocalVaultRuntime;

  beforeEach(async () => {
    root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'dailyuse-local-vault-'));
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

  async function selectVault(identityId = 'identity-1') {
    const binding = await runtime.selectVault(identityId);
    expect(binding?.status).toBe('Active');
    return binding!;
  }

  it('persists a profile-scoped binding and rebinds its owner without moving the Vault', async () => {
    const original = await selectVault('guest-identity');
    const rebound = await runtime.getBinding('online-identity');

    expect(rebound).toMatchObject({
      id: original.id,
      identityId: 'online-identity',
      rootPath: await fs.promises.realpath(vault),
      displayName: 'My Vault',
      status: 'Active',
    });

    const persisted = JSON.parse(
      await fs.promises.readFile(path.join(root, 'profile', 'local-vault-binding.json'), 'utf8'),
    ) as Record<string, unknown>;
    expect(persisted['identityId']).toBe('online-identity');
  });

  it('scans Markdown, parses frontmatter and links, and ignores private runtime directories', async () => {
    await selectVault();
    await fs.promises.mkdir(path.join(vault, 'Projects'), { recursive: true });
    await fs.promises.mkdir(path.join(vault, '.obsidian'), { recursive: true });
    await fs.promises.writeFile(
      path.join(vault, 'Projects', 'Roadmap.md'),
      [
        '---',
        'title: Product Roadmap',
        'tags:',
        '  - product',
        '  - planning',
        '---',
        '# Ignored heading',
        '',
        'See [[Architecture|system map]] and [[Decisions#ADR]].',
      ].join('\n'),
    );
    await fs.promises.writeFile(path.join(vault, '.obsidian', 'private.md'), '# Private');
    await fs.promises.writeFile(path.join(vault, 'plain.txt'), 'not a note');

    const scanned = await runtime.scanVault('identity-1');

    expect(scanned.notes).toHaveLength(1);
    expect(scanned.notes[0]).toMatchObject({
      relativePath: 'Projects/Roadmap.md',
      title: 'Product Roadmap',
      tags: ['product', 'planning'],
      outgoingLinks: ['Architecture', 'Decisions'],
    });
    expect(scanned.binding.lastScannedAt).toBe(1_750_000_000_000);
  });

  it('classifies runtime-only Vaults as empty and repository files or attachments as non-empty', async () => {
    await selectVault();
    await fs.promises.mkdir(path.join(vault, '.memory-flow'), { recursive: true });
    await fs.promises.mkdir(path.join(vault, '.obsidian'), { recursive: true });
    await fs.promises.writeFile(
      path.join(vault, '.memory-flow', 'repository.json'),
      '{"schemaVersion":1}',
    );
    await fs.promises.writeFile(path.join(vault, '.obsidian', 'workspace.json'), '{}');
    await fs.promises.writeFile(path.join(vault, '.scratch.swp'), 'temporary');

    await expect(runtime.inspectSyncContent('identity-1')).resolves.toBe('Empty');

    await fs.promises.writeFile(path.join(vault, 'README.md'), '# User knowledge');
    await expect(runtime.inspectSyncContent('identity-1')).resolves.toBe('NonEmpty');

    await fs.promises.rm(path.join(vault, 'README.md'));
    await fs.promises.mkdir(path.join(vault, 'Attachments'));
    await fs.promises.writeFile(path.join(vault, 'Attachments', 'diagram.png'), 'image');
    await expect(runtime.inspectSyncContent('identity-1')).resolves.toBe('NonEmpty');
  });

  it('rejects traversal and symlink escapes when reading notes', async () => {
    await selectVault();
    const outside = path.join(root, 'secret.md');
    await fs.promises.writeFile(outside, '# Secret');
    await fs.promises.symlink(outside, path.join(vault, 'escape.md'));

    await expect(
      runtime.readNote('identity-1', { relativePath: '../secret.md' }),
    ).rejects.toMatchObject<Partial<LocalVaultRuntimeError>>({ code: 'VALIDATION_ERROR' });
    await expect(
      runtime.readNote('identity-1', { relativePath: 'escape.md' }),
    ).rejects.toMatchObject<Partial<LocalVaultRuntimeError>>({ code: 'FORBIDDEN' });
  });

  it('searches content and opens the canonical note path in Obsidian', async () => {
    await selectVault();
    await fs.promises.mkdir(path.join(vault, 'Reference'), { recursive: true });
    const notePath = path.join(vault, 'Reference', 'Typescript.md');
    await fs.promises.writeFile(notePath, '# TypeScript\n\nStructural typing helps composition.');

    const search = await runtime.searchVault('identity-1', {
      query: 'structural typing',
    });
    expect(search.results).toHaveLength(1);
    expect(search.results[0]?.note.relativePath).toBe('Reference/Typescript.md');
    expect(search.results[0]?.matches[0]).toMatchObject({ lineNumber: 3, startIndex: 0 });

    await runtime.openInObsidian('identity-1', {
      relativePath: 'Reference/Typescript.md',
    });
    const uri = vi.mocked(platform.openExternal).mock.calls[0]?.[0] ?? '';
    expect(uri).toContain('obsidian://open?path=');
    expect(new URL(uri).searchParams.get('path')).toBe(await fs.promises.realpath(notePath));
  });

  it('writes an explicitly confirmed proposal once and replays the same request idempotently', async () => {
    await selectVault();
    const request = {
      relativePath: 'Agent/Approved note.md',
      contentMarkdown: '# Approved note\n\nUser reviewed this body.',
      proposalId: 'proposal-1',
      proposalRevision: 2,
      requestId: 'request-1',
    };

    const created = await runtime.writeConfirmedNote('identity-1', request);
    const replayed = await runtime.writeConfirmedNote('identity-1', request);

    expect(created.created).toBe(true);
    expect(replayed.created).toBe(false);
    expect(replayed.note.relativePath).toBe('Agent/Approved note.md');
    expect(await fs.promises.readFile(path.join(vault, 'Agent', 'Approved note.md'), 'utf8')).toBe(
      request.contentMarkdown,
    );
    await expect(
      runtime.writeConfirmedNote('identity-1', {
        ...request,
        proposalRevision: 3,
      }),
    ).rejects.toMatchObject<Partial<LocalVaultRuntimeError>>({ code: 'CONFLICT' });
  });

  it('refuses overwrite and write paths containing symlinked directories', async () => {
    await selectVault();
    await fs.promises.writeFile(path.join(vault, 'Existing.md'), '# Existing');
    const outsideDirectory = path.join(root, 'outside');
    await fs.promises.mkdir(outsideDirectory);
    await fs.promises.symlink(outsideDirectory, path.join(vault, 'Linked'));

    const baseRequest = {
      contentMarkdown: '# New',
      proposalId: 'proposal-2',
      proposalRevision: 1,
    };
    await expect(
      runtime.writeConfirmedNote('identity-1', {
        ...baseRequest,
        relativePath: 'Existing.md',
        requestId: 'existing-request',
      }),
    ).rejects.toMatchObject<Partial<LocalVaultRuntimeError>>({ code: 'CONFLICT' });
    await expect(
      runtime.writeConfirmedNote('identity-1', {
        ...baseRequest,
        relativePath: 'Linked/Escape.md',
        requestId: 'symlink-request',
      }),
    ).rejects.toMatchObject<Partial<LocalVaultRuntimeError>>({ code: 'FORBIDDEN' });
    await expect(fs.promises.stat(path.join(outsideDirectory, 'Escape.md'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  it('detaches without deleting user files', async () => {
    await selectVault();
    await fs.promises.writeFile(path.join(vault, 'Keep.md'), '# Keep');

    await runtime.detachVault('identity-1');

    expect(await runtime.getBinding('identity-1')).toMatchObject({ status: 'Detached' });
    expect(await fs.promises.readFile(path.join(vault, 'Keep.md'), 'utf8')).toBe('# Keep');
  });
});
