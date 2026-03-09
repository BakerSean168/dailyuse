import fs from 'fs';

const apiPath = 'apps/api/src/main.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

// replace implicit any on line 53
apiContent = apiContent.replace(/identityId: any, context: any\) =>/g, '(identityId: any, context: any) =>');
// Actually, earlier it was `identityId, context) =>`, but I probably misreplaced it. Let's make it robust:
apiContent = apiContent.replace(/\(identityId, context\) =>/g, '(identityId: any, context: any) =>');

fs.writeFileSync(apiPath, apiContent);
