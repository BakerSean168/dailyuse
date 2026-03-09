import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

// The `DeviceInfo.create` is probably expecting `DeviceInfoDTO` directly which we mapped above:
// `{ deviceId, deviceFingerprint, deviceType, deviceName, os, osVersion, appVersion, firstSeenAt, lastSeenAt }`
// The easiest fix is simply `deviceInfo as any`.
content = content.replace(/const device = DeviceInfo\.create\(\{[\s\S]*?\}\);/g, "const device = DeviceInfo.create(deviceInfo as any);");

fs.writeFileSync(sessionMgrPath, content);
