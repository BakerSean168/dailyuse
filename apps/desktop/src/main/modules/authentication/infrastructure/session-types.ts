/**
 * Shared types and utility functions for the authentication session infrastructure.
 */

import { IdentityId as IdentityIdValue } from '@dailyuse/domain-shared';
import type { AuthSession } from '@dailyuse/authentication/domain-server';
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

/** Extended session restore result (includes domain objects). */
export interface SessionRestoreResult extends ContractSessionRestoreResult {
  session?: AuthSession;
}

/** Extended auto-login result (includes domain objects). */
export interface AutoLoginResult extends ContractAutoLoginResult {
  session?: AuthSession;
}

/** Session status (extends DTO with device info). */
export interface SessionStatus extends Omit<SessionStatusDTO, 'device'> {
  device: DeviceInfoClientDTO;
}

export type OfflineLoginResponse = {
  ok: boolean;
  sessionId?: string;
  accessToken?: string;
  identityId?: string;
  expiresIn?: number;
  error?: string;
  authMode?: AuthMode;
};

// ============ Utility Functions ============

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
