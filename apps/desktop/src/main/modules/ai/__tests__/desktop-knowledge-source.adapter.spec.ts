import { describe, expect, it, vi } from 'vitest';
import type { LocalVaultElectronPort } from '@memoflow/repository/electron';
import { DesktopKnowledgeSourceAdapter } from '../desktop-knowledge-source.adapter';

const summary = {
  relativePath: 'Architecture/Runtime.md',
  title: 'Runtime architecture',
  excerpt: 'Capability resolution',
  tags: ['architecture'],
  outgoingLinks: ['ADR-035'],
  size: 100,
  updatedAt: 1_750_000_000_000 as never,
};

function createLocalVaultPort(active = true): LocalVaultElectronPort {
  return {
    getBinding: vi.fn(async () =>
      active
        ? ({ id: 'vault-1', status: 'Active' } as Awaited<
            ReturnType<LocalVaultElectronPort['getBinding']>
          >)
        : null,
    ),
    selectVault: vi.fn(),
    detachVault: vi.fn(),
    scanVault: vi.fn(async () => ({
      binding: { id: 'vault-1' } as never,
      notes: [summary],
      scannedAt: 1_750_000_000_000 as never,
    })),
    readNote: vi.fn(async () => ({
      ...summary,
      contentMarkdown: '# Runtime architecture\n\nCapability resolution is explicit.',
      frontmatter: { owner: 'platform' },
    })),
    searchVault: vi.fn(async () => ({
      query: 'capability',
      results: [{ note: summary, matches: [] }],
    })),
    openInObsidian: vi.fn(),
    writeConfirmedNote: vi.fn(),
    inspectSyncContent: vi.fn(async () => 'NonEmpty'),
  };
}

describe('DesktopKnowledgeSourceAdapter', () => {
  it('hydrates relevant resources exclusively from the selected local Vault', async () => {
    const localVault = createLocalVaultPort();
    const adapter = new DesktopKnowledgeSourceAdapter(localVault);

    const resources = await adapter.listRelevantNotes('identity-1', 'capability', 5);

    expect(localVault.searchVault).toHaveBeenCalledWith('identity-1', {
      query: 'capability',
      limit: 5,
    });
    expect(resources).toHaveLength(1);
    expect(resources[0]).toMatchObject({
      identityId: 'identity-1',
      repositoryId: 'vault-1',
      resourcePath: 'Architecture/Runtime.md',
      title: 'Runtime architecture',
      content: '# Runtime architecture\n\nCapability resolution is explicit.',
    });
    expect(resources[0]?.metadata).toMatchObject({
      owner: 'platform',
      tags: ['architecture'],
    });
  });

  it('returns no knowledge and performs no scan when the profile has no Vault binding', async () => {
    const localVault = createLocalVaultPort(false);
    const adapter = new DesktopKnowledgeSourceAdapter(localVault);

    await expect(adapter.listIndexableNotes('identity-1', 20)).resolves.toEqual([]);
    expect(localVault.scanVault).not.toHaveBeenCalled();
    expect(localVault.readNote).not.toHaveBeenCalled();
  });
});
