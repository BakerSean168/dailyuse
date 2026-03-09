import fs from 'fs';

const tokenMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/TokenManager.ts';
let content = fs.readFileSync(tokenMgrPath, 'utf8');

content = content.replace(/createdAt: now,\n/g, '');
content = content.replace(/updatedAt: now,\n/g, '');
content = content.replace(/this\.storageData\.updatedAt = Date\.now\(\);\n/g, '');
content = content.replace(/identityId: this\.storageData\.identityId,\n/g, '');

fs.writeFileSync(tokenMgrPath, content);
