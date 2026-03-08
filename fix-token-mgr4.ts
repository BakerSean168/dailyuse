import fs from 'fs';

const tokenMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/TokenManager.ts';
let content = fs.readFileSync(tokenMgrPath, 'utf8');

content = content.replace(/tokenData\.updatedAt = now;\n/g, '');
content = content.replace(/identityId: this\.cachedTokenData\.identityId,\n/g, '');

fs.writeFileSync(tokenMgrPath, content);
