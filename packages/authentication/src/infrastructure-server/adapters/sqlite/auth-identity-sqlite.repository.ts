/**
 * SqliteAuthIdentityRepository
 *
 * SQLite (better-sqlite3) implementation of IAuthIdentityRepository.
 * Follows the same transactional write / multi-table read pattern as the Prisma adapter.
 */

import type Database from 'better-sqlite3';
import type { IAuthIdentityRepository } from '../../../domain-server';
import { AuthIdentity } from '../../../domain-server';
import type { OAuthProvider } from '../../../domain-shared';
import { createLogger } from '@dailyuse/utils';
import {
	SqliteAuthIdentityMapper,
	type AuthIdentityRow,
	type AuthIdentifierRow,
	type AuthCredentialRow,
	type AuthOAuthBindingRow,
} from './mappers';

const logger = createLogger('SqliteAuthIdentityRepository');

export class SqliteAuthIdentityRepository implements IAuthIdentityRepository {
	constructor(private readonly db: Database.Database) {}

	// ── Write ──

	async save(identity: AuthIdentity): Promise<void> {
		try {
			const data = SqliteAuthIdentityMapper.toPersistence(identity);
			const d = data.identity;

			const trx = this.db.transaction(() => {
				// Upsert identity row
				this.db
					.prepare(
						`INSERT INTO auth_identities (id, status, failed_login_attempts, last_failed_attempt, locked_until, version, created_at, updated_at, deleted_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
					 ON CONFLICT(id) DO UPDATE SET
					   status = excluded.status,
					   failed_login_attempts = excluded.failed_login_attempts,
					   last_failed_attempt = excluded.last_failed_attempt,
					   locked_until = excluded.locked_until,
					   version = excluded.version,
					   updated_at = excluded.updated_at,
					   deleted_at = excluded.deleted_at`,
					)
					.run(
						d.id,
						d.status,
						d.failed_login_attempts,
						d.last_failed_attempt,
						d.locked_until,
						d.version,
						d.created_at,
						d.updated_at,
						d.deleted_at,
					);

				// Replace identifiers (delete + re-insert)
				this.db.prepare(`DELETE FROM auth_identifiers WHERE identity_id = ?`).run(d.id);
				const insertIdentifier = this.db.prepare(
					`INSERT INTO auth_identifiers (identity_id, type, value, is_verified) VALUES (?, ?, ?, ?)`,
				);
				for (const id of data.identifiers) {
					insertIdentifier.run(id.identity_id, id.type, id.value, id.is_verified);
				}

				// Replace credentials
				this.db.prepare(`DELETE FROM auth_credentials WHERE identity_id = ?`).run(d.id);
				const insertCred = this.db.prepare(
					`INSERT INTO auth_credentials (id, identity_id, type, status, password_hash, password_last_changed_at, created_at, last_used_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
				);
				for (const c of data.credentials) {
					insertCred.run(
						c.id,
						c.identity_id,
						c.type,
						c.status,
						c.password_hash,
						c.password_last_changed_at,
						c.created_at,
						c.last_used_at,
					);
				}

				// Replace OAuth bindings
				this.db.prepare(`DELETE FROM auth_oauth_bindings WHERE identity_id = ?`).run(d.id);
				const insertOAuth = this.db.prepare(
					`INSERT INTO auth_oauth_bindings (id, identity_id, provider, provider_subject_id, access_token, refresh_token, expires_at, created_at, last_used_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				);
				for (const b of data.oauthBindings) {
					insertOAuth.run(
						b.id,
						b.identity_id,
						b.provider,
						b.provider_subject_id,
						b.access_token,
						b.refresh_token,
						b.expires_at,
						b.created_at,
						b.last_used_at,
					);
				}
			});

			trx();
			logger.debug('[SqliteAuthIdentityRepository] Identity saved', { id: d.id });
		} catch (error) {
			logger.error('[SqliteAuthIdentityRepository] Save failed', {
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	// ── Read ──

	async findById(id: string): Promise<AuthIdentity | null> {
		const row = this.db
			.prepare(`SELECT * FROM auth_identities WHERE id = ?`)
			.get(id) as AuthIdentityRow | undefined;
		if (!row) return null;
		return this.hydrate(row);
	}

	async findByEmail(email: string): Promise<AuthIdentity | null> {
		const idRow = this.db
			.prepare(`SELECT identity_id FROM auth_identifiers WHERE type = 'EMAIL' AND value = ?`)
			.get(email) as { identity_id: string } | undefined;
		if (!idRow) return null;
		return this.findById(idRow.identity_id);
	}

	async findByPhone(phoneNumber: string): Promise<AuthIdentity | null> {
		const idRow = this.db
			.prepare(`SELECT identity_id FROM auth_identifiers WHERE type = 'PHONE' AND value = ?`)
			.get(phoneNumber) as { identity_id: string } | undefined;
		if (!idRow) return null;
		return this.findById(idRow.identity_id);
	}

	async findByOAuth(provider: OAuthProvider, subjectId: string): Promise<AuthIdentity | null> {
		const binding = this.db
			.prepare(
				`SELECT identity_id FROM auth_oauth_bindings WHERE provider = ? AND provider_subject_id = ?`,
			)
			.get(provider as string, subjectId) as { identity_id: string } | undefined;
		if (!binding) return null;
		return this.findById(binding.identity_id);
	}

	async existsByEmail(email: string): Promise<boolean> {
		const result = this.db
			.prepare(
				`SELECT COUNT(*) as cnt FROM auth_identifiers WHERE type = 'EMAIL' AND value = ?`,
			)
			.get(email) as { cnt: number };
		return result.cnt > 0;
	}

	async existsByPhone(phoneNumber: string): Promise<boolean> {
		const result = this.db
			.prepare(
				`SELECT COUNT(*) as cnt FROM auth_identifiers WHERE type = 'PHONE' AND value = ?`,
			)
			.get(phoneNumber) as { cnt: number };
		return result.cnt > 0;
	}

	// ── Delete ──

	async delete(identity: AuthIdentity): Promise<void> {
		const id = identity.id;
		const trx = this.db.transaction(() => {
			this.db.prepare(`DELETE FROM auth_identifiers WHERE identity_id = ?`).run(id);
			this.db.prepare(`DELETE FROM auth_oauth_bindings WHERE identity_id = ?`).run(id);
			this.db.prepare(`DELETE FROM auth_credentials WHERE identity_id = ?`).run(id);
			this.db.prepare(`DELETE FROM auth_sessions WHERE identity_id = ?`).run(id);
			this.db.prepare(`DELETE FROM auth_identities WHERE id = ?`).run(id);
		});
		trx();
	}

	// ── Private helpers ──

	private hydrate(row: AuthIdentityRow): AuthIdentity {
		const identifierRows = this.db
			.prepare(`SELECT * FROM auth_identifiers WHERE identity_id = ?`)
			.all(row.id) as AuthIdentifierRow[];

		const credentialRows = this.db
			.prepare(`SELECT * FROM auth_credentials WHERE identity_id = ?`)
			.all(row.id) as AuthCredentialRow[];

		const oauthRows = this.db
			.prepare(`SELECT * FROM auth_oauth_bindings WHERE identity_id = ?`)
			.all(row.id) as AuthOAuthBindingRow[];

		return SqliteAuthIdentityMapper.toDomain(row, identifierRows, credentialRows, oauthRows);
	}
}
