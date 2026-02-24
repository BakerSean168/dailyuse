/**
 * SQLite AuthIdentity Mapper
 *
 * Converts between SQLite rows and the AuthIdentity aggregate root.
 * Sub-entity rows (identifiers, credentials, oauth_bindings) are passed alongside
 * the identity row so that the full aggregate can be reconstructed.
 */

import type {
	AuthCredentialServerDTO,
	PasswordCredentialServerDTO,
	HashedPassword as IHashedPassword,
	CredentialStatus,
	AuthCredentialId,
	AuthIdentifierDTO,
	OAuthBindingServerDTO,
} from '@dailyuse/contracts/authentication';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { AuthIdentity } from '../../../../domain-server';
import {
	AuthIdentityStatus,
	CredentialType,
	CredentialStatus as CredentialStatusVO,
	HashedPassword,
	OAuthProvider,
	PasswordAlgorithm,
} from '../../../../domain-shared';
import { EmailIdentifier, PhoneIdentifier } from '../../../../domain-server/value-objects';
import { OAuthBinding, PasswordCredential } from '../../../../domain-server/entities';

// ============ SQLite Row Types ============

export interface AuthIdentityRow {
	id: string;
	status: string;
	failed_login_attempts: number;
	last_failed_attempt: number | null;
	locked_until: number | null;
	version: number;
	created_at: number;
	updated_at: number;
	deleted_at: number | null;
}

export interface AuthIdentifierRow {
	id: number;
	identity_id: string;
	type: string;
	value: string;
	is_verified: number; // 0 | 1
}

export interface AuthCredentialRow {
	id: string;
	identity_id: string;
	type: string;
	status: string;
	password_hash: string | null;
	password_last_changed_at: number | null;
	created_at: number;
	last_used_at: number | null;
}

export interface AuthOAuthBindingRow {
	id: string;
	identity_id: string;
	provider: string;
	provider_subject_id: string;
	access_token: string | null;
	refresh_token: string | null;
	expires_at: number | null;
	created_at: number;
	last_used_at: number | null;
}

// ============ Write Data Types ============

export interface AuthIdentityWriteData {
	identity: {
		id: string;
		status: string;
		failed_login_attempts: number;
		last_failed_attempt: number | null;
		locked_until: number | null;
		version: number;
		created_at: number;
		updated_at: number;
		deleted_at: number | null;
	};
	identifiers: {
		identity_id: string;
		type: string;
		value: string;
		is_verified: number;
	}[];
	credentials: {
		id: string;
		identity_id: string;
		type: string;
		status: string;
		password_hash: string | null;
		password_last_changed_at: number | null;
		created_at: number;
		last_used_at: number | null;
	}[];
	oauthBindings: {
		id: string;
		identity_id: string;
		provider: string;
		provider_subject_id: string;
		access_token: string | null;
		refresh_token: string | null;
		expires_at: number | null;
		created_at: number;
		last_used_at: number | null;
	}[];
}

// ============ Mapper ============

export class SqliteAuthIdentityMapper {
	// ── Row → Domain ──

	static toDomain(
		row: AuthIdentityRow,
		identifierRows: AuthIdentifierRow[],
		credentialRows: AuthCredentialRow[],
		oauthRows: AuthOAuthBindingRow[],
	): AuthIdentity {
		const identifiers = identifierRows.map((r) => {
			if (r.type === 'EMAIL') return EmailIdentifier.create(r.value, r.is_verified === 1);
			if (r.type === 'PHONE') return PhoneIdentifier.create(r.value, r.is_verified === 1);
			throw new Error(`Unknown identifier type: ${r.type}`);
		});

		const oauthBindings = oauthRows.map((r) =>
			OAuthBinding.load({
				id: r.id,
				provider: OAuthProvider.of(r.provider),
				providerSubjectId: r.provider_subject_id,
				accessToken: r.access_token ?? null,
				refreshToken: r.refresh_token ?? null,
				expiresAt: r.expires_at ? new Date(r.expires_at) : null,
				createdAt: new Date(r.created_at),
				lastUsedAt: r.last_used_at ? new Date(r.last_used_at) : null,
			}),
		);

		const credentials = credentialRows.map((r) => {
			if (r.type === CredentialType.PASSWORD || r.type === 'PASSWORD') {
				const hashStr = r.password_hash ?? '';
				const parts = hashStr.split('$');
				const salt = parts.length >= 6 ? parts[4] : '';

				return PasswordCredential.load({
					id: r.id,
					status: CredentialStatusVO.of(r.status),
					hashedPassword: HashedPassword.fromDTO({
						hash: hashStr,
						salt,
						algorithm: PasswordAlgorithm.ARGON2 as string as IHashedPassword['algorithm'],
						createdAt: r.password_last_changed_at ?? r.created_at,
					}),
					passwordLastChangedAt: new Date(r.password_last_changed_at ?? r.created_at),
					createdAt: new Date(r.created_at),
					lastUsedAt: r.last_used_at ? new Date(r.last_used_at) : null,
				});
			}
			throw new Error(`Unknown credential type: ${r.type}`);
		});

		return AuthIdentity.load({
			id: IdentityId.of(row.id),
			status: AuthIdentityStatus.of(row.status),
			failedLoginAttempts: row.failed_login_attempts,
			lastFailedAttempt: row.last_failed_attempt ? new Date(row.last_failed_attempt) : null,
			lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
			identifiers,
			oauthBindings,
			credentials,
			version: row.version,
			createdAt: new Date(row.created_at),
			updatedAt: new Date(row.updated_at),
			deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
		});
	}

	// ── Domain → Write Data ──

	static toPersistence(identity: AuthIdentity): AuthIdentityWriteData {
		const dto = identity.toServerDTO();
		const identityId = dto.id;

		return {
			identity: {
				id: dto.id,
				status: dto.status,
				failed_login_attempts: dto.failedLoginAttempts,
				last_failed_attempt: dto.lastFailedAttempt,
				locked_until: dto.lockedUntil,
				version: dto.version,
				created_at: dto.createdAt,
				updated_at: dto.updatedAt,
				deleted_at: dto.deletedAt,
			},
			identifiers: dto.identifiers.map((i: AuthIdentifierDTO) => ({
				identity_id: identityId,
				type: i.type,
				value: i.type === 'PHONE' ? (i.value as { value: string }).value : (i.value as string),
				is_verified: i.isVerified ? 1 : 0,
			})),
			credentials: dto.credentials.map((c: AuthCredentialServerDTO) => {
				const base = {
					id: c.id,
					identity_id: identityId,
					type: c.type,
					status: c.status,
					password_hash: null as string | null,
					password_last_changed_at: null as number | null,
					created_at: c.createdAt,
					last_used_at: c.lastUsedAt,
				};
				if (c.type === CredentialType.PASSWORD || c.type === 'PASSWORD') {
					const p = c as PasswordCredentialServerDTO;
					base.password_hash = p.hashedPassword.hash;
					base.password_last_changed_at = p.passwordLastChangedAt;
				}
				return base;
			}),
			oauthBindings: dto.oauthBindings.map((b: OAuthBindingServerDTO) => ({
				id: b.id,
				identity_id: identityId,
				provider: b.provider as string,
				provider_subject_id: b.providerSubjectId,
				access_token: b.accessToken ?? null,
				refresh_token: b.refreshToken ?? null,
				expires_at: b.expiresAt,
				created_at: b.createdAt,
				last_used_at: b.lastUsedAt,
			})),
		};
	}
}
