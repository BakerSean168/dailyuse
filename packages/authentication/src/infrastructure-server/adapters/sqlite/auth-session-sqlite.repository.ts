/**
 * SqliteAuthSessionRepository
 *
 * SQLite (better-sqlite3) implementation of IAuthSessionRepository.
 */

import type Database from 'better-sqlite3';
import type { IAuthSessionRepository } from '../../../domain-server';
import { AuthSession } from '../../../domain-server';
import { createLogger } from '@dailyuse/utils';
import { SqliteAuthSessionMapper, type AuthSessionRow } from './mappers';

const logger = createLogger('SqliteAuthSessionRepository');

export class SqliteAuthSessionRepository implements IAuthSessionRepository {
	constructor(private readonly db: Database.Database) {}

	// ── Write ──

	async save(session: AuthSession): Promise<void> {
		try {
			const d = SqliteAuthSessionMapper.toPersistence(session);

			this.db
				.prepare(
					`INSERT INTO auth_sessions
					 (id, identity_id, refresh_token_hash, device_id, device_fingerprint, device_type,
					  device_name, os, browser, ip_address, location, version,
					  created_at, expires_at, last_active_at, deleted_at)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
					 ON CONFLICT(id) DO UPDATE SET
					   refresh_token_hash = excluded.refresh_token_hash,
					   device_name = excluded.device_name,
					   os = excluded.os,
					   browser = excluded.browser,
					   ip_address = excluded.ip_address,
					   location = excluded.location,
					   expires_at = excluded.expires_at,
					   last_active_at = excluded.last_active_at,
					   deleted_at = excluded.deleted_at`,
				)
				.run(
					d.id,
					d.identity_id,
					d.refresh_token_hash,
					d.device_id,
					d.device_fingerprint,
					d.device_type,
					d.device_name,
					d.os,
					d.browser,
					d.ip_address,
					d.location,
					d.version,
					d.created_at,
					d.expires_at,
					d.last_active_at,
					d.deleted_at,
				);

			logger.debug('[SqliteAuthSessionRepository] Session saved', { id: d.id });
		} catch (error) {
			logger.error('[SqliteAuthSessionRepository] Save failed', {
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	// ── Read ──

	async findById(id: string): Promise<AuthSession | null> {
		const row = this.db
			.prepare(`SELECT * FROM auth_sessions WHERE id = ?`)
			.get(id) as AuthSessionRow | undefined;
		if (!row) return null;
		return SqliteAuthSessionMapper.toDomain(row);
	}

	async findByIdentityId(identityId: string): Promise<AuthSession[]> {
		const rows = this.db
			.prepare(
				`SELECT * FROM auth_sessions WHERE identity_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
			)
			.all(identityId) as AuthSessionRow[];
		return rows.map((r) => SqliteAuthSessionMapper.toDomain(r));
	}

	// ── Delete (soft-delete via deleted_at) ──

	async remove(session: AuthSession): Promise<void> {
		this.db
			.prepare(`UPDATE auth_sessions SET deleted_at = ? WHERE id = ?`)
			.run(Date.now(), session.id);
	}

	async removeAllByIdentityId(identityId: string): Promise<void> {
		this.db
			.prepare(`UPDATE auth_sessions SET deleted_at = ? WHERE identity_id = ? AND deleted_at IS NULL`)
			.run(Date.now(), identityId);
	}

	async removeExpired(): Promise<void> {
		this.db
			.prepare(`UPDATE auth_sessions SET deleted_at = ? WHERE expires_at < ? AND deleted_at IS NULL`)
			.run(Date.now(), Date.now());
	}
}
