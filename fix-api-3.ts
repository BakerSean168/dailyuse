import fs from 'fs';

const apiPath = 'apps/api/src/main.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

apiContent = apiContent.replace(/async \(identityId, context: any\) =>/g, 'async (identityId: any, context: any) =>');

// Also remove AIApiModule if it doesn't have createAIApiModule
// Let's check `packages/ai/src/api/index.ts`
fs.writeFileSync(apiPath, apiContent);
