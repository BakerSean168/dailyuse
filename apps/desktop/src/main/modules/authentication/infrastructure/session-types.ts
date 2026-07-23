/**
 * Shared types and utility functions for the authentication session infrastructure.
 */

import { IdentityId as IdentityIdValue } from '@dailyuse/domain-shared';
import type { AuthSession } from '@dailyuse/authentication/electron';
import type { IdentityId } from '@dailyuse/contracts/authentication';
import {
  DeviceType,
  type SessionRestoreResult as ContractSessionRestoreResult,
  type AutoLoginResult as ContractAutoLoginResult,
  type SessionStatusDTO,
  type DeviceInfoClientDTO,
  type DeviceInfoDTO,
} from '@dailyuse/contracts/authentication';
import { AuthMode } from '@dailyuse/contracts/authentication';

// ============ Exported Types ============

/** Extended session restore result (includes domain objects).
 * Residual 883: intentional extension of contracts SessionRestoreResult (+ domain session).
 * Residual 935 (soft): lifecycle uses LifecycleSessionRestoreResult (required hasValidSession), not this name.
 */
export interface SessionRestoreResult extends ContractSessionRestoreResult {
  session?: AuthSession;
}

/** Extended auto-login result (includes domain objects).
 * Residual 887: intentional extension of contracts AutoLoginResult (+ domain session).
 */
export interface AutoLoginResult extends ContractAutoLoginResult {
  session?: AuthSession;
}

/** Session status (SessionStatusDTO + device; residual 867: drop bogus Omit<'device'>).
 * Residual 889: intentional extension — required device (DeviceInfoClientDTO); not type-alias dual.
 */
export interface SessionStatus extends SessionStatusDTO {
  device: DeviceInfoClientDTO;
}

// Residual 867: contracts LoginResponse dual deleted.
// Residual 873: OfflineLoginResponse dual retired — sole body in contracts desktop-auth.types.
// Residual 925: OfflineLoginResponse name dual fully retired — consumers import contracts sole body.

// ============ Utility Functions ============
// Residual 937: sole toIdentityId / toDeviceInfoDTO helper bodies
// (guest/offline/remembered local duals retired).
// Residual 939: sole toErrorLog helper body (login-desktop-account local dual retired).

export function toIdentityId(value: string | IdentityId): IdentityId {
  return IdentityIdValue.of(String(value));
}

export function toErrorLog(error: unknown): unknown {
  if (error instanceof Error) {
    const details: Record<string, unknown> = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    const withCause = error as Error & { cause?: unknown };
    if (withCause.cause !== undefined) {
      details.cause = toErrorLog(withCause.cause);
    }

    return details;
  }

  return error;
}

export function toDeviceInfoDTO(client: DeviceInfoClientDTO): DeviceInfoDTO {
  const now = Date.now();
  return {
    deviceId: client.deviceId,
    deviceFingerprint: client.deviceFingerprint ?? '',
    deviceType: (client.deviceType as DeviceType) || 'Browser',
    deviceName: client.deviceName ?? null,
    os: client.os ?? null,
    osVersion: client.osVersion ?? null,
    browser: null,
    appVersion: client.appVersion ?? null,
    ipAddress: null,
    userAgent: null,
    location: null,
    firstSeenAt: client.firstSeenAt ?? now,
    lastSeenAt: client.lastSeenAt ?? now,
  };
}

export const LOCAL_ACCESS_TOKEN = 'local-token';
export const GUEST_ACCESS_TOKEN = 'guest-local-token';

/**
 * Desktop guest/offline placeholder tokens must never authorize cloud APIs
 * (GitHub knowledge App, PowerSync remote, etc.).
 */
export function toCloudAccessToken(token: string | null | undefined): string | null {
  if (!token) return null;
  if (token === GUEST_ACCESS_TOKEN || token === LOCAL_ACCESS_TOKEN) return null;
  return token;
}
