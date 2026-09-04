import type { IElectronDatabase } from '@memoflow/contracts/electron';
import type {
  AIProviderOnboardingCommitOutcome,
  AIProviderReplacementCommitOutcome,
  IAIProviderOnboardingCommitPort,
} from '../../../application/ports/provider-onboarding-commit.port';
import type { IAIProviderSecretVault } from '../../../application/ports/provider-secret-vault.port';
import { AISecretCipher } from '../../security/ai-secret-cipher';
import { PowerSyncAIProviderConfigMapper } from './mappers';

interface OnboardingCommitRow {
  identity_id: string;
  base_url: string;
  target_provider_id: string | null;
  expires_at: number;
  consumed_at: number | null;
}

class ReplacementRollback extends Error {
  constructor(readonly outcome: AIProviderReplacementCommitOutcome) {
    super(outcome);
  }
}

/**
 * Desktop atomic Provider onboarding persistence.
 *
 * The onboarding row is localOnly, so consuming it and inserting/replacing the
 * synced Provider share one SQLite write transaction. Any failed Provider write
 * rolls the one-time consume back too.
 */
export class PowerSyncAIProviderOnboardingCommitAdapter implements IAIProviderOnboardingCommitPort {
  private cipher: IAIProviderSecretVault | null;

  constructor(
    private readonly db: IElectronDatabase,
    secretCipher?: IAIProviderSecretVault,
  ) {
    this.cipher = secretCipher ?? null;
  }

  private get secretCipher(): IAIProviderSecretVault {
    return (this.cipher ??= AISecretCipher.fromEnv());
  }

  async commit(
    input: Parameters<IAIProviderOnboardingCommitPort['commit']>[0],
  ): Promise<AIProviderOnboardingCommitOutcome> {
    if (String(input.provider.identityId) !== input.identityId) return 'SESSION_UNAVAILABLE';
    const row = PowerSyncAIProviderConfigMapper.toPersistence(input.provider, this.secretCipher);

    try {
      return await this.db.writeTransaction(async (tx) => {
        const session = await tx.getOptional<OnboardingCommitRow>(
          `SELECT identity_id, base_url, target_provider_id, expires_at, consumed_at
           FROM ai_provider_onboarding_sessions
           WHERE id = ? AND identity_id = ? AND target_provider_id IS NULL
             AND expires_at > ? AND consumed_at IS NULL
           LIMIT 1`,
          [input.onboardingId, input.identityId, input.now],
        );
        if (
          !session ||
          session.identity_id !== input.identityId ||
          session.target_provider_id != null ||
          session.base_url !== input.provider.baseUrl
        ) {
          return 'SESSION_UNAVAILABLE' as const;
        }

        const duplicate = await tx.getOptional<{ id: string }>(
          `SELECT id FROM ai_provider_configs
           WHERE identity_id = ? AND name = ? AND deleted_at IS NULL
           LIMIT 1`,
          [input.identityId, row.name],
        );
        if (duplicate) return 'CONFLICT' as const;

        const consumed = await tx.execute(
          `UPDATE ai_provider_onboarding_sessions
           SET consumed_at = ?, updated_at = ?
           WHERE id = ? AND identity_id = ? AND target_provider_id IS NULL
             AND expires_at > ? AND consumed_at IS NULL`,
          [input.now, input.now, input.onboardingId, input.identityId, input.now],
        );
        if (consumed.rowsAffected !== 1) return 'SESSION_UNAVAILABLE' as const;

        if (row.is_default) {
          await tx.execute(
            `UPDATE ai_provider_configs SET is_default = 0, updated_at = ?
             WHERE identity_id = ? AND deleted_at IS NULL`,
            [row.updated_at, input.identityId],
          );
        }

        await tx.execute(
          `INSERT INTO ai_provider_configs (
            id, identity_id, name, provider_type, base_url, api_key_encrypted,
            default_model, is_active, is_default, priority,
            version, created_at, updated_at, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            row.id,
            row.identity_id,
            row.name,
            row.provider_type,
            row.base_url,
            row.api_key_encrypted,
            row.default_model,
            row.is_active,
            row.is_default,
            row.priority,
            row.version,
            row.created_at,
            row.updated_at,
            row.deleted_at,
          ],
        );

        return 'COMMITTED' as const;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) return 'CONFLICT';
      throw error;
    }
  }

  async replace(
    input: Parameters<IAIProviderOnboardingCommitPort['replace']>[0],
  ): Promise<AIProviderReplacementCommitOutcome> {
    if (
      String(input.replacement.id) !== input.targetProviderId ||
      String(input.replacement.identityId) !== input.identityId
    ) {
      return 'SESSION_UNAVAILABLE';
    }

    try {
      return await this.db.writeTransaction(async (tx) => {
        const session = await tx.getOptional<OnboardingCommitRow>(
          `SELECT identity_id, base_url, target_provider_id, expires_at, consumed_at
           FROM ai_provider_onboarding_sessions
           WHERE id = ? AND identity_id = ? AND target_provider_id = ?
             AND expires_at > ? AND consumed_at IS NULL
           LIMIT 1`,
          [input.onboardingId, input.identityId, input.targetProviderId, input.now],
        );
        if (
          !session ||
          session.identity_id !== input.identityId ||
          session.target_provider_id !== input.targetProviderId ||
          session.base_url !== input.replacement.baseUrl
        ) {
          return 'SESSION_UNAVAILABLE' as const;
        }

        const current = await tx.getOptional<{ id: string; version: number }>(
          `SELECT id, version FROM ai_provider_configs
           WHERE id = ? AND identity_id = ? AND deleted_at IS NULL
           LIMIT 1`,
          [input.targetProviderId, input.identityId],
        );
        if (!current) return 'PROVIDER_NOT_FOUND' as const;
        if (current.version !== input.expectedVersion) return 'CONFLICT' as const;

        const consumed = await tx.execute(
          `UPDATE ai_provider_onboarding_sessions
           SET consumed_at = ?, updated_at = ?
           WHERE id = ? AND identity_id = ? AND target_provider_id = ?
             AND expires_at > ? AND consumed_at IS NULL`,
          [
            input.now,
            input.now,
            input.onboardingId,
            input.identityId,
            input.targetProviderId,
            input.now,
          ],
        );
        if (consumed.rowsAffected !== 1) return 'SESSION_UNAVAILABLE' as const;

        const updated = await tx.execute(
          `UPDATE ai_provider_configs
           SET base_url = ?, api_key_encrypted = ?, default_model = ?, version = ?, updated_at = ?
           WHERE id = ? AND identity_id = ? AND version = ? AND deleted_at IS NULL`,
          [
            input.replacement.baseUrl,
            this.secretCipher.encrypt(input.replacement.apiKey),
            input.replacement.defaultModel,
            input.replacement.version,
            input.replacement.updatedAt,
            input.targetProviderId,
            input.identityId,
            input.expectedVersion,
          ],
        );
        if (updated.rowsAffected !== 1) {
          throw new ReplacementRollback('CONFLICT');
        }

        return 'REPLACED' as const;
      });
    } catch (error) {
      if (error instanceof ReplacementRollback) return error.outcome;
      throw error;
    }
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /unique constraint|constraint failed.*unique|already exists/i.test(error.message);
}
