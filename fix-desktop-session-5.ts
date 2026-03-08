import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

content = content.replace(/osVersion: os\.release\(\) \?\? null,/g, "osVersion: os.release() || null,");
content = content.replace(/deviceModel: os\.cpus\(\)\[0\]\?\.model \?\? null,/g, "deviceModel: os.cpus()[0]?.model || null,");
content = content.replace(/appVersion: app\.getVersion\(\) \?\? null,/g, "appVersion: app.getVersion() || null,");

content = content.replace(/device,/g, "deviceInfo: device as any,");
content = content.replace(/ipAddress: '127\.0\.0\.1',/g, "");

content = content.replace(/const expiredCount = await this\.sessionRepository\.removeExpired\(\);/g, "await this.sessionRepository.removeExpired();\n      const expiredCount = 0;");

// findActiveByIdentityId(accountId) => accountId as unknown as IdentityId
content = content.replace(/this\.sessionRepository\.findByIdentityId\(accountId\)/g, "this.sessionRepository.findByIdentityId(accountId as unknown as IdentityId)");

// session?.touch(Date.now()); => session?.touch();
content = content.replace(/session\?\.touch\(Date\.now\(\)\);/g, "session?.touch();");

fs.writeFileSync(sessionMgrPath, content);
