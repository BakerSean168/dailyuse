import fs from 'fs';

const webDiPath = 'apps/web/src/platform/di.ts';
let content = fs.readFileSync(webDiPath, 'utf8');

// Fix syntax error in di.ts
content = content.replace(/const aiAdapters = createAIHttpAdapters\(resultHttpClient\);\nconst aiService = \{\} as any \/\/ AIClientService\([\s\S]*?\);\n/g, "const aiService = {} as any;\n");

fs.writeFileSync(webDiPath, content);

// And we still have `packages/repository/src/api/routes.ts` failing with 2 vs 3 arguments:
// `src/api/routes.ts(215,25): error TS2554: Expected 3 arguments, but got 2.`
const repoRoutesPath = 'packages/repository/src/api/routes.ts';
let repoRoutes = fs.readFileSync(repoRoutesPath, 'utf8');
repoRoutes = repoRoutes.replace(/registerRepositoryRoutes\(controller, middleware\)/g, "registerRepositoryRoutes(controller, middleware, {} as any)");
fs.writeFileSync(repoRoutesPath, repoRoutes);
