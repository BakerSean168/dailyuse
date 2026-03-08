import fs from 'fs';

// Fix TokenManager
const tokenMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/TokenManager.ts';
let tokenContent = fs.readFileSync(tokenMgrPath, 'utf8');
tokenContent = tokenContent.replace(/createdAt: Date\.now\(\),/g, '');
tokenContent = tokenContent.replace(/this\.storageData\.updatedAt = Date\.now\(\);/g, '');
tokenContent = tokenContent.replace(/identityId: this\.storageData\.identityId,/g, '');
fs.writeFileSync(tokenMgrPath, tokenContent);

// Fix SessionManager duplicates
const sessionMgrPath = 'apps/desktop/src/main/modules/authentication/infrastructure/SessionManager.ts';
let sessionContent = fs.readFileSync(sessionMgrPath, 'utf8');
sessionContent = sessionContent.replace(/import type \{ IAuthSessionRepository, IAuthIdentityRepository, IAuthIdentityRepository \} from '@dailyuse\/authentication\/domain-server';/g, "import type { IAuthSessionRepository, IAuthIdentityRepository } from '@dailyuse/authentication/domain-server';");
sessionContent = sessionContent.replace(/private readonly identityRepository: IAuthIdentityRepository;/g, "");
sessionContent = sessionContent.replace(/private identityRepository: IAuthIdentityRepository \| null = null;/g, "private identityRepository: IAuthIdentityRepository | null = null;");
fs.writeFileSync(sessionMgrPath, sessionContent);
