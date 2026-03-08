import fs from 'fs';

const tokenMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/TokenManager.ts';
let content = fs.readFileSync(tokenMgrPath, 'utf8');

content = content.replace(/updatedAt: Date\.now\(\),/g, '');
content = content.replace(/identityId: this\.storageData\.identityId,/g, '');
content = content.replace(/this\.storageData\.updatedAt = Date\.now\(\);/g, '');

fs.writeFileSync(tokenMgrPath, content);
