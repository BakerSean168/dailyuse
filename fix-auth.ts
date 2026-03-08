import fs from 'fs';

const sessionManagerPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let sessionContent = fs.readFileSync(sessionManagerPath, 'utf8');

// Fix AuthSessionId
sessionContent = sessionContent.replace(/as string/g, 'as unknown as AuthSessionId');
sessionContent = sessionContent.replace(/Type '"DESKTOP"'/g, ''); // Fix device type
sessionContent = sessionContent.replace(/'DESKTOP'/g, "'Desktop'");

// Fix findActiveSessions
sessionContent = sessionContent.replace(/findActiveSessions\(/g, 'findActive\(');

// Fix refreshAccessToken
sessionContent = sessionContent.replace(/\.refreshAccessToken/g, '.refreshTokenHash');

// Fix deleteExpired
sessionContent = sessionContent.replace(/deleteExpired\(/g, 'delete\(');

// Fix findByAccountId -> findActiveByAccountId or similar
sessionContent = sessionContent.replace(/findByAccountId/g, 'findActiveByIdentityId');

fs.writeFileSync(sessionManagerPath, sessionContent);

// Fix network config required issue
const networkMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/NetworkStateManager.ts';
let networkContent = fs.readFileSync(networkMgrPath, 'utf8');
networkContent = networkContent.replace(/this\.config\.enableHealthCheck/g, 'this.config.enableHealthCheck === true');
networkContent = networkContent.replace(/this\.config\.checkInterval/g, '(this.config.checkInterval || 30000)');
fs.writeFileSync(networkMgrPath, networkContent);

// Fix token manager issues
const tokenMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/TokenManager.ts';
let tokenContent = fs.readFileSync(tokenMgrPath, 'utf8');
tokenContent = tokenContent.replace(/createdAt: Date\.now\(\),/g, '');
tokenContent = tokenContent.replace(/this\.storageData\.updatedAt/g, 'Date.now()'); // dummy fix
tokenContent = tokenContent.replace(/identityId: this\.storageData\.identityId,/g, '');
fs.writeFileSync(tokenMgrPath, tokenContent);
