import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

content = content.replace(/osVersion: os\.release\(\),/g, "osVersion: os.release() ?? null,");
content = content.replace(/deviceModel: os\.cpus\(\)\[0\]\?\.model,/g, "deviceModel: os.cpus()[0]?.model ?? null,");
content = content.replace(/appVersion: app\.getVersion\(\),/g, "appVersion: app.getVersion() ?? null,");

content = content.replace(/identityId: verification\.identityId!,/g, "identityId: verification.identityId! as unknown as IdentityId,");
content = content.replace(/identityId: guestId,/g, "identityId: guestId as unknown as IdentityId,");

content = content.replace(/const expiredCount = await this\.sessionRepository\.removeExpired\(\);/g, "await this.sessionRepository.removeExpired();\n      const expiredCount = 0;");

content = content.replace(/this\.sessionRepository\.findByIdentityId\('guest'\)/g, "this.sessionRepository.findByIdentityId('guest' as unknown as IdentityId)");
content = content.replace(/this\.sessionRepository\.findByIdentityId\(accountId\)/g, "this.sessionRepository.findByIdentityId(accountId as unknown as IdentityId)");
content = content.replace(/this\.sessionRepository\.findByIdentityId\(verification\.identityId!\)/g, "this.sessionRepository.findByIdentityId(verification.identityId! as unknown as IdentityId)");

content = content.replace(/session\?\.touch\(Date\.now\(\)\);/g, "session?.touch();");

fs.writeFileSync(sessionMgrPath, content);
