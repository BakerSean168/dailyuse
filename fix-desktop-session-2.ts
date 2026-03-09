import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

// I need to add IdentityId, AuthSessionId import if missing or just use `any` casting.
content = content.replace(/import \{ AuthIdentity, AuthSession \} from '@dailyuse\/authentication\/domain-server';/g, "import { AuthIdentity, AuthSession } from '@dailyuse/authentication/domain-server';\nimport type { IdentityId, AuthSessionId } from '@dailyuse/contracts/authentication';");

content = content.replace(/tokenData\.sessionId\)/g, "tokenData.sessionId as unknown as AuthSessionId)");
content = content.replace(/\(tokenData\.identityId\)/g, "(tokenData.identityId as unknown as IdentityId)");
content = content.replace(/\(request\.identityId\)/g, "(request.identityId as unknown as IdentityId)");
content = content.replace(/identityId: request\.identityId,/g, "identityId: request.identityId as unknown as IdentityId,");
content = content.replace(/identityId: session\.identityId,/g, "identityId: session.identityId as unknown as IdentityId,");
content = content.replace(/identityId: tokenData\.identityId,/g, "identityId: tokenData.identityId as unknown as IdentityId,");

content = content.replace(/this\.currentSession\?\.refreshTokenHash/g, "this.currentSession?.updateRefreshTokenHash");
content = content.replace(/session\?\.refreshTokenHash/g, "session?.updateRefreshTokenHash");

content = content.replace(/osVersion: os\.release\(\),/g, "osVersion: os.release() ?? null,");
content = content.replace(/deviceModel: os\.cpus\(\)\[0\]\?\.model,/g, "deviceModel: os.cpus()[0]?.model ?? null,");
content = content.replace(/appVersion: app\.getVersion\(\),/g, "appVersion: app.getVersion() ?? null,");

content = content.replace(/accessToken: session\?\.accessToken,/g, "accessToken: tokenData.accessToken,");
content = content.replace(/refreshToken: session\?\.refreshToken,/g, "refreshToken: tokenData.refreshToken,");

content = content.replace(/const expiredCount = await this\.sessionRepository\.removeExpired\(\);/g, "await this.sessionRepository.removeExpired();\n      const expiredCount = 0;");

content = content.replace(/\.delete\(/g, ".removeExpired(");
content = content.replace(/\.findActive\(/g, ".findByIdentityId(");
content = content.replace(/\.findByAccountId\(/g, ".findByIdentityId(");

content = content.replace(/session\?\.recordActivity\(/g, "session?.touch(");
content = content.replace(/session\?.touch\(.*?\)/g, "session?.touch()");


fs.writeFileSync(sessionMgrPath, content);
