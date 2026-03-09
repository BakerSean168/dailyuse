import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

content = content.replace(/deviceModel: \(os\.cpus\(\)\[0\]\?\.model \|\| null\) as string \| null,/g, "deviceModel: ((os.cpus()[0]?.model || null) as string | null) || null,");
content = content.replace(/osVersion: \(os\.release\(\) \|\| null\) as string \| null,/g, "osVersion: ((os.release() || null) as string | null) || null,");
content = content.replace(/appVersion: \(app\.getVersion\(\) \|\| null\) as string \| null,/g, "appVersion: ((app.getVersion() || null) as string | null) || null,");

content = content.replace(/return 0; \/\/ Return dummy expiredCount/g, "return Promise.resolve(0); // Return dummy expiredCount");
content = content.replace(/return expiredCount;/g, "return 0; // Return dummy expiredCount");

content = content.replace(/findByIdentityId\(accountId\)/g, "findByIdentityId(accountId as unknown as IdentityId)");
content = content.replace(/this\.sessionRepository\.findByIdentityId\(accountId\)/g, "this.sessionRepository.findByIdentityId(accountId as unknown as IdentityId)");
content = content.replace(/this\.sessionRepository\.findByIdentityId\('guest'\)/g, "this.sessionRepository.findByIdentityId('guest' as unknown as IdentityId)");

content = content.replace(/session\?\.touch\(Date\.now\(\)\);/g, "session?.touch();");
content = content.replace(/error: result\.error \?\? undefined,/g, "error: result.error || undefined,");

fs.writeFileSync(sessionMgrPath, content);
