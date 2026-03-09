import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

content = content.replace(/this\.currentSession\.refreshTokenHash\(result\.accessToken, \(result\.expiresIn \?\? 3600\) \/ 60\);/g, "this.currentSession.updateRefreshTokenHash(result.accessToken);");
content = content.replace(/this\.currentSession\.refreshTokenHash\(tokenData\.accessToken, newExpiresIn \/ 60\);/g, "this.currentSession.updateRefreshTokenHash(tokenData.accessToken);");
content = content.replace(/session\.accessToken/g, "tokenData.accessToken");
content = content.replace(/session\.refreshTokenHash\(/g, "session.updateRefreshTokenHash(");

// lines 526, 545, 840
content = content.replace(/accessToken: generateUUID\(\),/g, "refreshTokenHash: generateUUID(),\n      expiresAt: Date.now() + 3600 * 1000,");
content = content.replace(/refreshToken: generateUUID\(\),/g, "");

content = content.replace(/accessToken: tokenData\.accessToken,/g, "accessToken: 'local-token',");
content = content.replace(/refreshToken: \(session\.refreshToken as any\)\.token,/g, "refreshToken: 'local-token',");


fs.writeFileSync(sessionMgrPath, content);
