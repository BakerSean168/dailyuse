import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

content = content.replace(/lastActiveAt: this\.currentSession\?\.lastActiveAt,/g, 'lastActivityAt: this.currentSession?.lastActiveAt?.getTime(),');
content = content.replace(/sessionCreatedAt: this\.currentSession\?\.createdAt,/g, 'sessionCreatedAt: this.currentSession?.createdAt?.getTime(),');
content = content.replace(/sessionExpiresAt: this\.currentSession\?\.expiresAt,/g, 'sessionExpiresAt: this.currentSession?.expiresAt?.getTime(),');

fs.writeFileSync(sessionMgrPath, content);
