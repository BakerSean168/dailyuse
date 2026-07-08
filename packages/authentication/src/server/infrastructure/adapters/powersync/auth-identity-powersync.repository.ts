import type { IElectronDatabase } from '@dailyuse/contracts/electron';
import type { IAuthIdentityRepository } from '../../../domain';
import { AuthIdentity } from '../../../domain';
import type { OAuthProvider } from '../../../domain';
import { eventBus } from '@dailyuse/utils/domain';
import { createLogger } from '@dailyuse/utils/logger';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import {
  PowerSyncAuthIdentityMapper,
  type PowerSyncAuthCredentialRow,
  type PowerSyncAuthIdentifierRow,
  type PowerSyncAuthIdentityRow,
  type PowerSyncAuthOAuthBindingRow,
} from './mappers';

const logger = createLogger('PowerSyncAuthIdentityRepository');
const eventBusAdapter = createEventBusAdapter(eventBus);

export class PowerSyncAuthIdentityRepository
  extends AggregateRepositoryBase<AuthIdentity>
  implements IAuthIdentityRepository
{
  constructor(private readonly db: IElectronDatabase) {
    super(eventBusAdapter);
  }

  protected async persist(identity: AuthIdentity): Promise<void> {
    const data = PowerSyncAuthIdentityMapper.toPersistence(identity);
    const d = data.identity;

    await this.db.writeTransaction(async (tx) => {
      const updateResult = await tx.execute(
        `UPDATE auth_identities
         SET status = ?,
             failed_login_attempts = ?,
             last_failed_attempt = ?,
             locked_until = ?,
             version = ?,
             updated_at = ?,
             deleted_at = ?
         WHERE id = ?`,
        [
          d.status,
          d.failed_login_attempts,
          d.last_failed_attempt,
          d.locked_until,
          d.version,
          d.updated_at,
          d.deleted_at,
          d.id,
        ],
      );

      if (updateResult.rowsAffected === 0) {
        await tx.execute(
          `INSERT INTO auth_identities (
             id, status, failed_login_attempts, last_failed_attempt, locked_until,
             version, created_at, updated_at, deleted_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            d.id,
            d.status,
            d.failed_login_attempts,
            d.last_failed_attempt,
            d.locked_until,
            d.version,
            d.created_at,
            d.updated_at,
            d.deleted_at,
          ],
        );
      }

      await tx.execute(`DELETE FROM auth_identifiers WHERE identity_id = ?`, [d.id]);
      for (const identifier of data.identifiers) {
        await tx.execute(
          `INSERT INTO auth_identifiers (id, identity_id, type, value, is_verified, created_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            identifier.id,
            identifier.identity_id,
            identifier.type,
            identifier.value,
            identifier.is_verified,
            identifier.created_at,
          ],
        );
      }

      await tx.execute(`DELETE FROM auth_credentials WHERE identity_id = ?`, [d.id]);
      for (const credential of data.credentials) {
        await tx.execute(
          `INSERT INTO auth_credentials (
             id, identity_id, type, status, password_hash, password_last_changed_at,
             version, created_at, last_used_at, deleted_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            credential.id,
            credential.identity_id,
            credential.type,
            credential.status,
            credential.password_hash,
            credential.password_last_changed_at,
            credential.version,
            credential.created_at,
            credential.last_used_at,
            credential.deleted_at,
          ],
        );
      }

      await tx.execute(`DELETE FROM auth_oauth_bindings WHERE identity_id = ?`, [d.id]);
      for (const binding of data.oauthBindings) {
        await tx.execute(
          `INSERT INTO auth_oauth_bindings (
             id, identity_id, provider, provider_subject_id,
             access_token, refresh_token, expires_at, created_at, last_used_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            binding.id,
            binding.identity_id,
            binding.provider,
            binding.provider_subject_id,
            binding.access_token,
            binding.refresh_token,
            binding.expires_at,
            binding.created_at,
            binding.last_used_at,
          ],
        );
      }
    });

    logger.debug('[PowerSyncAuthIdentityRepository] Identity saved', { id: d.id });
  }

  async findById(id: string): Promise<AuthIdentity | null> {
    const row = await this.db.getOptional<PowerSyncAuthIdentityRow>(
      `SELECT * FROM auth_identities WHERE id = ? LIMIT 1`,
      [id],
    );
    if (!row) return null;
    return this.hydrate(row);
  }

  async findByEmail(email: string): Promise<AuthIdentity | null> {
    const idRow = await this.db.getOptional<{ identity_id: string }>(
      `SELECT identity_id FROM auth_identifiers WHERE type = 'Email' AND value = ? LIMIT 1`,
      [email.trim().toLowerCase()],
    );
    if (!idRow) return null;
    return this.findById(idRow.identity_id);
  }

  async findByPhone(phoneNumber: string): Promise<AuthIdentity | null> {
    const idRow = await this.db.getOptional<{ identity_id: string }>(
      `SELECT identity_id FROM auth_identifiers WHERE type = 'Phone' AND value = ? LIMIT 1`,
      [phoneNumber.trim().replace(/[\s()-]/g, '')],
    );
    if (!idRow) return null;
    return this.findById(idRow.identity_id);
  }

  async findByOAuth(provider: OAuthProvider, subjectId: string): Promise<AuthIdentity | null> {
    const row = await this.db.getOptional<{ identity_id: string }>(
      `SELECT identity_id FROM auth_oauth_bindings WHERE provider = ? AND provider_subject_id = ? LIMIT 1`,
      [provider as string, subjectId],
    );
    if (!row) return null;
    return this.findById(row.identity_id);
  }

  async existsByEmail(email: string): Promise<boolean> {
    const row = await this.db.getOptional<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM auth_identifiers WHERE type = 'Email' AND value = ?`,
      [email.trim().toLowerCase()],
    );
    return Number(row?.cnt ?? 0) > 0;
  }

  async existsByPhone(phoneNumber: string): Promise<boolean> {
    const row = await this.db.getOptional<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM auth_identifiers WHERE type = 'Phone' AND value = ?`,
      [phoneNumber.trim().replace(/[\s()-]/g, '')],
    );
    return Number(row?.cnt ?? 0) > 0;
  }

  async delete(identity: AuthIdentity): Promise<void> {
    const id = String(identity.id);

    await this.db.writeTransaction(async (tx) => {
      await tx.execute(`DELETE FROM auth_identifiers WHERE identity_id = ?`, [id]);
      await tx.execute(`DELETE FROM auth_oauth_bindings WHERE identity_id = ?`, [id]);
      await tx.execute(`DELETE FROM auth_credentials WHERE identity_id = ?`, [id]);
      await tx.execute(`DELETE FROM auth_sessions WHERE identity_id = ?`, [id]);
      await tx.execute(`DELETE FROM auth_identities WHERE id = ?`, [id]);
    });
  }

  private async hydrate(row: PowerSyncAuthIdentityRow): Promise<AuthIdentity> {
    const identifierRows = await this.db.getAll<PowerSyncAuthIdentifierRow>(
      `SELECT identity_id, type, value, is_verified, created_at FROM auth_identifiers WHERE identity_id = ?`,
      [row.id],
    );

    const credentialRows = await this.db.getAll<PowerSyncAuthCredentialRow>(
      `SELECT id, identity_id, type, status, password_hash, password_last_changed_at, version, created_at, last_used_at, deleted_at
       FROM auth_credentials
       WHERE identity_id = ?`,
      [row.id],
    );

    const oauthRows = await this.db.getAll<PowerSyncAuthOAuthBindingRow>(
      `SELECT id, identity_id, provider, provider_subject_id, access_token, refresh_token, expires_at, created_at, last_used_at
       FROM auth_oauth_bindings
       WHERE identity_id = ?`,
      [row.id],
    );

    return PowerSyncAuthIdentityMapper.toDomain(row, identifierRows, credentialRows, oauthRows);
  }
}
