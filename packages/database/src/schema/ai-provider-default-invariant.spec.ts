import { describe, expect, it, vi } from 'vitest';
import {
  AI_PROVIDER_DEFAULT_INVARIANT_INDEX,
  prepareAIProviderDefaultInvariant,
  type AIProviderDefaultSchemaQueryClient,
} from './ai-provider-default-invariant';

function result(rows: Array<Record<string, unknown>>) {
  return { rows, rowCount: rows.length };
}

describe('prepareAIProviderDefaultInvariant', () => {
  it('rejects existing identities with more than one live default', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(result([{ regclass: 'ai_provider_configs' }]))
      .mockResolvedValueOnce(result([{ identity_id: 'identity-1', duplicate_count: 2 }]));

    await expect(
      prepareAIProviderDefaultInvariant({ query } as AIProviderDefaultSchemaQueryClient),
    ).rejects.toThrow(/duplicate default providers/);
    expect(query.mock.calls.some(([sql]) => String(sql).includes('CREATE UNIQUE INDEX'))).toBe(
      false,
    );
  });

  it('creates a verified partial unique index for live defaults', async () => {
    const query = vi
      .fn()
      .mockResolvedValueOnce(result([{ regclass: 'ai_provider_configs' }]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([{ regclass: null }]))
      .mockResolvedValueOnce(result([]))
      .mockResolvedValueOnce(result([{ regclass: AI_PROVIDER_DEFAULT_INVARIANT_INDEX }]));

    await expect(
      prepareAIProviderDefaultInvariant({ query } as AIProviderDefaultSchemaQueryClient),
    ).resolves.toEqual({ tablePresent: true, indexPresent: true, indexCreated: true });
    expect(
      query.mock.calls.some(
        ([sql]) =>
          String(sql).includes('CREATE UNIQUE INDEX IF NOT EXISTS') &&
          String(sql).includes('WHERE is_default = TRUE AND deleted_at IS NULL'),
      ),
    ).toBe(true);
  });
});
