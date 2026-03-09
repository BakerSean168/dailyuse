import fs from 'fs';

const apiPath = 'apps/api/src/main.ts';
let apiContent = fs.readFileSync(apiPath, 'utf8');

// The export exists in packages/ai/src/api/module.ts and is exported via packages/ai/src/api/index.ts, but it's not exported correctly in packages/ai/src/index.ts?
// Wait, `export * from './api';` is in packages/ai/src/index.ts.
// Maybe the package build didn't include it. Let's change the import to @dailyuse/ai directly, as that usually works.
apiContent = apiContent.replace(/from '@dailyuse\/ai\/api';/g, "from '@dailyuse/ai';");

fs.writeFileSync(apiPath, apiContent);
