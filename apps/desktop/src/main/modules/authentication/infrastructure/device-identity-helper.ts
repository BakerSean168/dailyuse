/**
 * Device Identity Helper
 *
 * Manages the persistent desktop device ID and fingerprint generation.
 * Extracted from SessionManager to isolate device-identity concern.
 *
 * @module authentication/infrastructure/device-identity-helper
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import * as os from 'os';
import { app } from 'electron';
import type { ILogger } from '@dailyuse/utils/logger';
import type { DeviceInfoClientDTO } from '@dailyuse/contracts/authentication';

export class DeviceIdentityHelper {
  constructor(
    private sharedAuthDir: string,
    private readonly logger: ILogger,
  ) {}

  setSharedAuthDir(dir: string): void {
    this.sharedAuthDir = dir;
    this.logger.info('Shared auth directory set', { sharedAuthDir: dir });
  }

  generateDeviceInfo(): DeviceInfoClientDTO {
    const machineId = this.getOrCreateInstallationDeviceId();
    const platform = os.platform();
    const release = os.release();
    const hostname = os.hostname();
    const now = Date.now();

    return {
      deviceId: machineId,
      deviceFingerprint: this.generateFingerprint(machineId, platform, hostname),
      deviceType: 'Desktop',
      deviceName: hostname,
      os: platform,
      osVersion: release as string | undefined,
      appVersion: app.getVersion() || undefined,
      firstSeenAt: now,
      lastSeenAt: now,
    };
  }

  private getOrCreateInstallationDeviceId(): string {
    const deviceIdPath = path.join(this.sharedAuthDir, 'device-id');

    try {
      if (fs.existsSync(deviceIdPath)) {
        const persistedId = fs.readFileSync(deviceIdPath, 'utf8').trim();
        if (persistedId.length > 0) {
          return persistedId;
        }
      }
    } catch (error) {
      this.logger.warn('Failed to read persisted desktop device id, regenerating', { error });
    }

    const generatedId = crypto.randomUUID();

    try {
      fs.mkdirSync(this.sharedAuthDir, { recursive: true });
      fs.writeFileSync(deviceIdPath, generatedId, 'utf8');
    } catch (error) {
      this.logger.warn('Failed to persist desktop device id, using in-memory fallback', { error });
    }

    return generatedId;
  }

  private generateFingerprint(machineId: string, platform: string, hostname: string): string {
    const data = `${machineId}-${platform}-${hostname}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
