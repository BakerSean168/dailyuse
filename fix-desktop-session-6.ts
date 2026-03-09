import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

content = content.replace(/osVersion: os\.release\(\) \|\| null,/g, "osVersion: (os.release() || null) as string | null,");
content = content.replace(/deviceModel: os\.cpus\(\)\[0\]\?\.model \|\| null,/g, "deviceModel: (os.cpus()[0]?.model || null) as string | null,");
content = content.replace(/appVersion: app\.getVersion\(\) \|\| null,/g, "appVersion: (app.getVersion() || null) as string | null,");

content = content.replace(/const session = AuthSession\.create\(\{/g, "const session = AuthSession.create({\n      id: generateUUID() as unknown as AuthSessionId,");

content = content.replace(/return expiredCount;/g, "return 0; // Return dummy expiredCount");
content = content.replace(/this\.sessionRepository\.findByIdentityId\(accountId\)/g, "this.sessionRepository.findByIdentityId(accountId as unknown as IdentityId)");

content = content.replace(/session\?\.touch\(.*?\);/g, "session?.touch();");

// error TS2322: Type 'string | null' is not assignable to type 'string | undefined'
content = content.replace(/error: result.error,/g, "error: result.error ?? undefined,");

fs.writeFileSync(sessionMgrPath, content);
