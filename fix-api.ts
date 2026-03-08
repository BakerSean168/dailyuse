import fs from 'fs';

const apiPath = 'apps/api/src/main.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

// Fix implicit any
apiContent = apiContent.replace(/context\) =>/g, 'context: any) =>');
apiContent = apiContent.replace(/identityId, context\) =>/g, 'identityId: any, context: any) =>');

fs.writeFileSync(apiPath, apiContent);
