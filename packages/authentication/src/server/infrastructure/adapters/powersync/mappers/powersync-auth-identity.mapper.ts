import type { AuthCredentialId, PasswordCredentialServerDTO, AuthIdentifierDTO, HashedPassword as IHashedPassword, OAuthBindingServerDTO } from '@dailyuse/contracts/authentication';
import { createHash } from 'node:crypto';
import { IdentityId } from '@dailyuse/domain-shared/shared';
import { AuthIdentity } from '../../../../domain';
import {
  AuthIdentityStatus,
  CredentialStatus as CredentialStatusVO,
  CredentialType,
  HashedPassword,
  OAuthProvider,
  PasswordAlgorithm,
} from '../../../../domain';
import { OAuthBinding, PasswordCredential } from '../../../../domain/entities';
import { EmailIdentifier, PhoneIdentifier } from '../../../../domain/value-objects';

export interface PowerSyncAuthIdentityRow {
  id: string;
  status: string;
  failed_login_attempts: number;
  last_failed_attempt: string | null;
  locked_until: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PowerSyncAuthIdentifierRow {
  id?: string;
  identity_id: string;
  type: string;
  value: string;
  is_verified: number;
  created_at: string;
}

export interface PowerSyncAuthCredentialRow {
  id: string;
  identity_id: string;
  type: string;
  status: string;
  password_hash: string | null;
  password_last_changed_at: string | null;
  version: number;
  created_at: string;
  last_used_at: string | null;
  deleted_at: string | null;
}

export interface PowerSyncAuthOAuthBindingRow {
  id: string;
  identity_id: string;
  provider: string;
  provider_subject_id: string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  created_at: string;
  last_used_at: string | null;
}

export interface PowerSyncAuthIdentityWriteData {
  identity: {
    id: string;
    status: string;
    failed_login_attempts: number;
    last_failed_attempt: string | null;
    locked_until: string | null;
    version: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
  };
  identifiers: {
    id: string;
    identity_id: string;
    type: string;
    value: string;
    is_verified: number;
    created_at: string;
  }[];
  credentials: {
    id: string;
    identity_id: string;
    type: string;
    status: string;
    password_hash: string | null;
    password_last_changed_at: string | null;
    version: number;
    created_at: string;
    last_used_at: string | null;
    deleted_at: string | null;
  }[];
  oauthBindings: {
    id: string;
    identity_id: string;
    provider: string;
    provider_subject_id: string;
    access_token: string | null;
    refresh_token: string | null;
    expires_at: string | null;
    created_at: string;
    last_used_at: string | null;
  }[];
}

function toIso(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return new Date(value).toISOString();
}

function toMillis(value: string | null | undefined): number | null {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function normalizeIdentifierValue(type: string, value: string): string {
  const trimmed = value.trim();
  if (type === 'Email') {
    return trimmed.toLowerCase();
  }
  if (type === 'Phone') {
    return trimmed.replace(/[\s()-]/g, '');
  }
  return trimmed;
}

function buildIdentifierId(identityId: string, type: string, value: string): string {
  const normalized = normalizeIdentifierValue(type, value);
  const hash = createHash('sha256')
    .update(`${identityId}:${type}:${normalized}`)
    .digest('hex')
    .slice(0, 24);
  return `AuthIdentifierId_${hash}`;
}

export class PowerSyncAuthIdentityMapper {
  static toDomain(
    row: PowerSyncAuthIdentityRow,
    identifierRows: PowerSyncAuthIdentifierRow[],
    credentialRows: PowerSyncAuthCredentialRow[],
    oauthRows: PowerSyncAuthOAuthBindingRow[],
  ): AuthIdentity {
    const identifiers = identifierRows.map((r) => {
      if (r.type === 'Email') return EmailIdentifier.create(r.value, r.is_verified === 1);
      if (r.type === 'Phone') return PhoneIdentifier.create(r.value, r.is_verified === 1);
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
      if (r.type === CredentialType.Password) {
        const hashStr = r.password_hash ?? '';
        const parts = hashStr.split('$');
        const salt = parts.length >= 6 ? parts[4] : '';

        return PasswordCredential.load({
          id: r.id as AuthCredentialId,
          status: CredentialStatusVO.of(r.status),
          hashedPassword: HashedPassword.fromDTO({
            hash: hashStr,
            salt,
            algorithm: PasswordAlgorithm.Argon2 as string as IHashedPassword['algorithm'],
            createdAt: toMillis(r.password_last_changed_at) ?? toMillis(r.created_at) ?? Date.now(),
          }),
          passwordLastChangedAt: new Date(
            toMillis(r.password_last_changed_at) ?? toMillis(r.created_at) ?? Date.now(),
          ),
          createdAt: new Date(toMillis(r.created_at) ?? Date.now()),
          lastUsedAt: r.last_used_at ? new Date(r.last_used_at) : null,
        });
      }

      throw new Error(`Unknown credential type: ${r.type}`);
    });

    return AuthIdentity.load({
      id: IdentityId.of(row.id),
      status: AuthIdentityStatus.of(row.status),
      failedLoginAttempts: Number(row.failed_login_attempts ?? 0),
      lastFailedAttempt: row.last_failed_attempt ? new Date(row.last_failed_attempt) : null,
      lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
      identifiers,
      oauthBindings,
      credentials,
      version: Number(row.version ?? 1),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
    });
  }

  static toPersistence(identity: AuthIdentity): PowerSyncAuthIdentityWriteData {
    const dto = identity.toServerDTO();
    const identityId = dto.id;
    const createdAtIso = toIso(dto.createdAt) ?? new Date().toISOString();

    return {
      identity: {
        id: dto.id,
        status: dto.status,
        failed_login_attempts: dto.failedLoginAttempts,
        last_failed_attempt: toIso(dto.lastFailedAttempt),
        locked_until: toIso(dto.lockedUntil),
        version: dto.version,
        created_at: createdAtIso,
        updated_at: toIso(dto.updatedAt) ?? createdAtIso,
        deleted_at: toIso(dto.deletedAt),
      },
      identifiers: dto.identifiers.map((i: AuthIdentifierDTO) => ({
        id: buildIdentifierId(
          identityId,
          i.type,
          i.type === 'Phone' ? (i.value as { value: string }).value : (i.value as string),
        ),
        identity_id: identityId,
        type: i.type,
        value: normalizeIdentifierValue(
          i.type,
          i.type === 'Phone' ? (i.value as { value: string }).value : (i.value as string),
        ),
        is_verified: i.isVerified ? 1 : 0,
        created_at: createdAtIso,
      })),
      credentials: dto.credentials.map((c: PasswordCredentialServerDTO) => {
        const base = {
          id: c.id,
          identity_id: identityId,
          type: c.type,
          status: c.status,
          password_hash: null as string | null,
          password_last_changed_at: null as string | null,
          version: 1,
          created_at: toIso(c.createdAt) ?? createdAtIso,
          last_used_at: toIso(c.lastUsedAt),
          deleted_at: null as string | null,
        };

        if (c.type === CredentialType.Password) {
          const p = c as PasswordCredentialServerDTO;
          base.password_hash = p.hashedPassword.hash;
          base.password_last_changed_at = toIso(p.passwordLastChangedAt);
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
        expires_at: toIso(b.expiresAt),
        created_at: toIso(b.createdAt) ?? createdAtIso,
        last_used_at: toIso(b.lastUsedAt),
      })),
    };
  }
}
