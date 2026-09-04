import { describe, expect, it, vi } from 'vitest';
import type { IElectronDatabase, IElectronDatabaseTransaction } from '@memoflow/contracts/electron';
import type { IAIProviderSecretVault } from '../../../application/ports/provider-secret-vault.port';
import { PowerSyncAIProviderOnboardingCommitAdapter } from './ai-provider-onboarding-commit-powersync.adapter';

const vault: IAIProviderSecretVault = {
  encrypt: (value) => `enc:${value}`,
  decrypt: (value) => value.startsWith('enc:') ? value.slice(4) : value,
  needsRewrap: () => false,
  rewrap: (value) => `enc:${value}`,
};

const provider = {
  id: 'provider-1',
  identityId: 'identity-1',
  name: 'OpenAI',
  providerType: 'openai_compatible',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'sk-test',
  defaultModel: 'gpt-5-mini',
  availableModels: [],
  isActive: true,
  isDefault: true,
  priority: 100,
  version: 1,
  createdAt: 1_750_000_000_000,
  updatedAt: 1_750_000_000_000,
  deletedAt: null,
} as never;

function fixture(options: { session?: boolean; duplicate?: boolean; insertFails?: boolean } = {}) {
  const events: string[] = [];
  let optionalCall = 0;
  const tx: IElectronDatabaseTransaction = {
    getOptional: vi.fn(async () => {
      optionalCall += 1;
      if (optionalCall === 1) {
        events.push('read-session');
        return options.session === false
          ? null
          : {
              identity_id: 'identity-1',
              base_url: 'https://api.openai.com/v1',
              expires_at: 1_750_000_100_000,
              consumed_at: null,
            };
      }
      events.push('check-duplicate');
      return options.duplicate ? { id: 'existing' } : null;
    }),
    execute: vi.fn(async (sql: string) => {
      if (sql.includes('UPDATE ai_provider_onboarding_sessions')) {
        events.push('consume-session');
        return { rowsAffected: 1 };
      }
      if (sql.includes('UPDATE ai_provider_configs SET is_default = 0')) {
        events.push('clear-default');
        return { rowsAffected: 1 };
      }
      if (sql.includes('INSERT INTO ai_provider_configs')) {
        events.push('insert-provider');
        if (options.insertFails) throw new Error('provider insert failed');
        return { rowsAffected: 1 };
      }
      return { rowsAffected: 0 };
    }),
    getAll: vi.fn(async () => []),
    get: vi.fn(async () => ({} as never)),
  };
  const db = {
    writeTransaction: vi.fn(async <T>(work: (value: IElectronDatabaseTransaction) => Promise<T>) => {
      events.push('tx-start');
      try {
        const result = await work(tx);
        events.push('tx-commit');
        return result;
      } catch (error) {
        events.push('tx-rollback');
        throw error;
      }
    }),
    execute: vi.fn(),
    getAll: vi.fn(),
    getOptional: vi.fn(),
    get: vi.fn(),
  } as unknown as IElectronDatabase;
  return { db, tx, events };
}

describe('PowerSyncAIProviderOnboardingCommitAdapter', () => {
  it('consumes the one-time local session and inserts the Provider inside one writeTransaction', async () => {
    const { db, events } = fixture();
    const adapter = new PowerSyncAIProviderOnboardingCommitAdapter(db, vault);

    await expect(adapter.commit({
      identityId: 'identity-1',
      onboardingId: 'onboarding-1234567890',
      provider,
      now: 1_750_000_000_000,
    })).resolves.toBe('COMMITTED');

    expect(db.writeTransaction).toHaveBeenCalledTimes(1);
    expect(events).toEqual([
      'tx-start',
      'read-session',
      'check-duplicate',
      'consume-session',
      'clear-default',
      'insert-provider',
      'tx-commit',
    ]);
  });

  it('does not write a Provider when the onboarding handle is unavailable or already consumed', async () => {
    const { db, tx, events } = fixture({ session: false });
    const adapter = new PowerSyncAIProviderOnboardingCommitAdapter(db, vault);

    await expect(adapter.commit({
      identityId: 'identity-1',
      onboardingId: 'onboarding-1234567890',
      provider,
      now: 1_750_000_000_000,
    })).resolves.toBe('SESSION_UNAVAILABLE');

    expect(tx.execute).not.toHaveBeenCalled();
    expect(events).toEqual(['tx-start', 'read-session', 'tx-commit']);
  });

  it('keeps consume and insert in the same rollback boundary when Provider persistence fails', async () => {
    const { db, events } = fixture({ insertFails: true });
    const adapter = new PowerSyncAIProviderOnboardingCommitAdapter(db, vault);

    await expect(adapter.commit({
      identityId: 'identity-1',
      onboardingId: 'onboarding-1234567890',
      provider,
      now: 1_750_000_000_000,
    })).rejects.toThrow('provider insert failed');

    expect(events.at(-1)).toBe('tx-rollback');
    expect(events.indexOf('consume-session')).toBeGreaterThan(events.indexOf('tx-start'));
    expect(events.indexOf('insert-provider')).toBeGreaterThan(events.indexOf('consume-session'));
  });
});
