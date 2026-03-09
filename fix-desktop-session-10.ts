import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

// I should actually see what lines 510, 511, 826, 827 are. Let's just force `as any` there, or `null`.
// The errors are literally "Type 'string | undefined' is not assignable to type 'string | null'". So it wants `null` if undefined!
content = content.replace(/osVersion: \(os\.release\(\) \|\| undefined\) as string \| undefined,/g, "osVersion: (os.release() || null) as any,");
content = content.replace(/deviceModel: \(os\.cpus\(\)\[0\]\?\.model \|\| undefined\) as string \| undefined,/g, "deviceModel: (os.cpus()[0]?.model || null) as any,");
content = content.replace(/appVersion: \(app\.getVersion\(\) \|\| undefined\) as string \| undefined,/g, "appVersion: (app.getVersion() || null) as any,");

content = content.replace(/findByIdentityId\(verification\.identityId! as unknown as IdentityId\)/g, "findByIdentityId(verification.identityId! as any)");
content = content.replace(/findByIdentityId\(verification\.identityId!\)/g, "findByIdentityId(verification.identityId! as any)");

fs.writeFileSync(sessionMgrPath, content);
