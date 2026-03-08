import fs from 'fs';

const tokenMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/TokenManager.ts';
let content = fs.readFileSync(tokenMgrPath, 'utf8');

// In TokenManager.ts line 258 `identityId` shouldn't be in TokenStatus
content = content.replace(/identityId: tokenData\.identityId,\n/g, '');

fs.writeFileSync(tokenMgrPath, content);
