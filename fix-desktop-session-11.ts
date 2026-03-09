import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

// lines 510, 511, 826, 827
content = content.replace(/os: deviceInfo\.os \?\? undefined,/g, "os: (deviceInfo.os ?? null) as string | null,");
content = content.replace(/browser: deviceInfo\.appVersion \?\? undefined,/g, "browser: (deviceInfo.appVersion ?? null) as string | null,");

// line 652
content = content.replace(/const sessions = await this\.sessionRepository\.findByIdentityId\(identityId\);/g, "const sessions = await this.sessionRepository.findByIdentityId(identityId as unknown as IdentityId);");

fs.writeFileSync(sessionMgrPath, content);
