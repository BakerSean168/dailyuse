/**
 * SQLite AuthSession Mapper
 *
 * Converts between a flat SQLite row and the AuthSession aggregate.
 */

import type {
	DeviceInfo as IDeviceInfo,
	DeviceType as IDeviceType,
	AuthSessionId,
} from '@dailyuse/contracts/authentication';
import { AuthSession } from '../../../../domain-server';
import type { AuthSessionState } from '../../../../domain-server';
import { SessionStatus, DeviceInfo } from '../../../../domain-shared';
import type { IdentityId } from '@dailyuse/domain-shared/shared';

// ============ SQLite Row Type ============

export interface AuthSessionRow {
	id: string;
	identity_id: string;
	refresh_token_hash: string | null;
	device_id: string;
	device_fingerprint: string;
	device_type: string;
	device_name: string | null;
	os: string | null;
	browser: string | null;
	ip_address: string | null;
	location: string | null; // JSON-serialised
	version: number;
	created_at: number;
	expires_at: number;
	last_active_at: number;
	deleted_at: number | null;
}

// ============ Write Data Type ============

export interface AuthSessionWriteData {
	id: string;
	identity_id: string;
	refresh_token_hash: string | null;
	device_id: string;
	device_fingerprint: string;
	device_type: string;
	device_name: string | null;
	os: string | null;
	browser: string | null;
	ip_address: string | null;
	location: string | null;
	version: number;
	created_at: number;
	expires_at: number;
	last_active_at: number;
	deleted_at: number | null;
}

// ============ Mapper ============

export class SqliteAuthSessionMapper {
	// ── Row → Domain ──

	static toDomain(row: AuthSessionRow): AuthSession {
		return AuthSession.load(SqliteAuthSessionMapper.toState(row));
	}

	static toState(row: AuthSessionRow): AuthSessionState {
		const geoLocation = row.location ? (JSON.parse(row.location) as {
			country?: string | null;
			region?: string | null;
			city?: string | null;
			timezone?: string | null;
		}) : null;

		const deviceInfoDTO: IDeviceInfo = {
			deviceId: row.device_id,
			deviceFingerprint: row.device_fingerprint,
			deviceType: row.device_type as IDeviceType,
			deviceName: row.device_name ?? null,
			os: row.os ?? null,
			osVersion: null,
			browser: row.browser ?? null,
			appVersion: null,
			ipAddress: row.ip_address ?? null,
			userAgent: null,
			location: geoLocation
				? {
						country: geoLocation.country ?? null,
						region: geoLocation.region ?? null,
						city: geoLocation.city ?? null,
						timezone: geoLocation.timezone ?? null,
					}
				: null,
			firstSeenAt: row.created_at,
			lastSeenAt: row.last_active_at,
		};

		const isRevoked = row.deleted_at != null;
		const isExpired = row.expires_at < Date.now();
		let status: typeof SessionStatus.ACTIVE;
		if (isRevoked) {
			status = SessionStatus.REVOKED;
		} else if (isExpired) {
			status = SessionStatus.EXPIRED;
		} else {
			status = SessionStatus.ACTIVE;
		}

		return {
			id: row.id as AuthSessionId,
			identityId: row.identity_id as IdentityId,
			deviceInfo: DeviceInfo.fromDTO(deviceInfoDTO),
			refreshTokenHash: row.refresh_token_hash ?? undefined,
			status,
			createdAt: new Date(row.created_at),
			expiresAt: new Date(row.expires_at),
			lastActiveAt: new Date(row.last_active_at),
			isRevoked,
		};
	}

	// ── Domain → Write Data ──

	static toPersistence(session: AuthSession): AuthSessionWriteData {
		const dto = session.toServerDTO();
		const deviceInfo = dto.deviceInfo;

		return {
			id: dto.id,
			identity_id: dto.identityId,
			refresh_token_hash: dto.refreshTokenHash ?? null,
			device_id: deviceInfo.deviceId,
			device_fingerprint: deviceInfo.deviceFingerprint,
			device_type: String(deviceInfo.deviceType),
			device_name: deviceInfo.deviceName ?? null,
			os: deviceInfo.os ?? null,
			browser: deviceInfo.browser ?? null,
			ip_address: deviceInfo.ipAddress ?? null,
			location: deviceInfo.location ? JSON.stringify(deviceInfo.location) : null,
			version: 1,
			created_at: dto.createdAt,
			expires_at: dto.expiresAt,
			last_active_at: dto.lastActiveAt,
			deleted_at: dto.isRevoked ? Date.now() : null,
		};
	}
}
