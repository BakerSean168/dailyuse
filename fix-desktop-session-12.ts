import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

content = content.replace(/const device = DeviceInfo\.create\(\{/g, "const device = DeviceInfo.create({\n      deviceId: 'desktop',\n      deviceFingerprint: 'desktop',");

fs.writeFileSync(sessionMgrPath, content);
