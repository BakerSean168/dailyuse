import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

content = content.replace(/osVersion: \(\(os\.release\(\) \|\| null\) as string \| null\) \|\| null,/g, "osVersion: (os.release() || undefined) as string | undefined,");
content = content.replace(/deviceModel: \(\(os\.cpus\(\)\[0\]\?\.model \|\| null\) as string \| null\) \|\| null,/g, "deviceModel: (os.cpus()[0]?.model || undefined) as string | undefined,");
content = content.replace(/appVersion: \(\(app\.getVersion\(\) \|\| null\) as string \| null\) \|\| null,/g, "appVersion: (app.getVersion() || undefined) as string | undefined,");

content = content.replace(/osVersion: release as string \| null,/g, "osVersion: release as string | undefined,");

content = content.replace(/findByIdentityId\(verification\.identityId!\)/g, "findByIdentityId(verification.identityId! as unknown as IdentityId)");

fs.writeFileSync(sessionMgrPath, content);
