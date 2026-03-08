import fs from 'fs';

const tokenMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/TokenManager.ts';
let content = fs.readFileSync(tokenMgrPath, 'utf8');

// sessionId is also not expected
content = content.replace(/sessionId: tokenData\.sessionId,\n/g, '');

fs.writeFileSync(tokenMgrPath, content);
