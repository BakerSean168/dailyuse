import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

content = content.replace(/const deletedCount = await this\.sessionRepository\.removeExpired\(\);/g, "await this.sessionRepository.removeExpired();\n      const deletedCount = 0;");

content = content.replace(/osVersion: release,/g, "osVersion: release as string | null,");

content = content.replace(/this\.currentSession\.touch\('HEARTBEAT'\);/g, "this.currentSession.touch();");

fs.writeFileSync(sessionMgrPath, content);
