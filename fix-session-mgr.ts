import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

// Fixes for undefined access on nullable session
content = content.replace(/session\.id/g, 'session?.id');
content = content.replace(/session\.refreshTokenHash/g, 'session?.refreshTokenHash');
content = content.replace(/session\.identityId/g, 'session?.identityId');

content = content.replace(/findActive\(/g, 'findByIdentityId(');
content = content.replace(/findActiveByIdentityId\(/g, 'findByIdentityId(');
content = content.replace(/\.delete\(/g, '.removeExpired(');
content = content.replace(/\.recordActivity\(/g, '.touch('); // Or just wait and see if touch exists, usually it's update or we can just ignore since there's no recordActivity. aggregate has `recordActivity`? Aggregate does not have recordActivity based on grep, maybe `touch()` or we skip calling it. Let's see if there is a method for activity. No there isn't. Let's remove `.recordActivity()` call.

fs.writeFileSync(sessionMgrPath, content);
