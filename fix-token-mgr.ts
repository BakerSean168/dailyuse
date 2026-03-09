import fs from 'fs';

const tokenMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/TokenManager.ts';
let content = fs.readFileSync(tokenMgrPath, 'utf8');

// The original interface from contracts might not have identityId on TokenStatus, createdAt/updatedAt on TokenStorageData. Let's fix those.
content = content.replace(/this\.storageData\.updatedAt \= Date\.now\(\);/g, '');
// Let's replace any `updatedAt: ` as well
content = content.replace(/updatedAt: Date\.now\(\),/g, '');
content = content.replace(/createdAt: Date\.now\(\),/g, '');
content = content.replace(/identityId: this\.storageData\.identityId,/g, '');

fs.writeFileSync(tokenMgrPath, content);
