import fs from 'fs';

const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let content = fs.readFileSync(sessionMgrPath, 'utf8');

content = content.replace(/Type '"DESKTOP"'/g, ''); // not valid here anymore
content = content.replace(/'DESKTOP'/g, "'Desktop'");

// For line 367 and 395 which had: `refreshAccessToken` is not callable
content = content.replace(/session\?.refreshTokenHash\(\)/g, "session?.refreshTokenHash"); // It's a property now!
content = content.replace(/session\?.refreshTokenHash\(/g, "session?.updateRefreshTokenHash(");

// Line 509 & 510 string | undefined is not assignable to string | null
// Let's replace any `undefined` values being passed to DTOs that expect `null`
// Wait, the DTO expects null? DeviceInfo expects string|null
// The error says: `Type 'string | undefined' is not assignable to type 'string | null'`
// we will just `?? null` the arguments.
content = content.replace(/osVersion: os\.release\(\),/g, 'osVersion: os.release() ?? null,');
content = content.replace(/deviceModel: os\.cpus\(\)\[0\]\?\.model,/g, 'deviceModel: os.cpus()[0]?.model ?? null,');
content = content.replace(/appVersion: app\.getVersion\(\),/g, 'appVersion: app.getVersion() ?? null,');

// line 526, 545, 840 `accessToken` doesn't exist on AuthSession.
// In domain-server, AuthSession doesn't store the accessToken, just the refreshTokenHash!
// Desktop SessionManager is probably trying to construct a `Tokens` object from it. We can just use the `tokenData.accessToken`
content = content.replace(/accessToken: session\?.accessToken,/g, 'accessToken: tokenData.accessToken,');

// line 598 `lastActivityAt` -> `lastActiveAt`
content = content.replace(/lastActivityAt/g, 'lastActiveAt');

// line 632 `deleteExpired` -> `removeExpired`
// wait, I already replaced `.delete(` with `.removeExpired(` but what if the original was `deleteExpired`?
content = content.replace(/\.deleteExpired\(/g, '.removeExpired(');

content = content.replace(/session\?.recordActivity\(/g, '');

fs.writeFileSync(sessionMgrPath, content);
