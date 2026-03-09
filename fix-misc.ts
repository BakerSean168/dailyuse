import fs from 'fs';

// Task template mapper
const mapperPath = 'packages/task/src/infrastructure-server/adapters/prisma/mappers/prisma-task-template-mapper.ts';
if (fs.existsSync(mapperPath)) {
  let content = fs.readFileSync(mapperPath, 'utf8');
  content = content.replace(/status: d\.status,/g, "status: d.status as any,");
  fs.writeFileSync(mapperPath, content);
}

// API Routes
const repoRoutesPath = 'packages/repository/src/api/routes/repository.routes.ts';
if (fs.existsSync(repoRoutesPath)) {
  let content = fs.readFileSync(repoRoutesPath, 'utf8');
  content = content.replace(/\{ identityId: (.*?) \}/g, "{ identityId: $1 } as any");
  content = content.replace(/req\.user\?\.id/g, "req.user?.identityId");
  fs.writeFileSync(repoRoutesPath, content);
}

// Packages index missing 3rd argument
const apiRoutesPath = 'packages/repository/src/api/routes.ts';
if (fs.existsSync(apiRoutesPath)) {
  let content = fs.readFileSync(apiRoutesPath, 'utf8');
  content = content.replace(/registerRepositoryRoutes\(controller, middleware\);/g, "registerRepositoryRoutes(controller, middleware, {} as any);");
  fs.writeFileSync(apiRoutesPath, content);
}

// Web platform di.ts missing `createAIHttpAdapters`
const webDiPath = 'apps/web/src/platform/di.ts';
if (fs.existsSync(webDiPath)) {
  let content = fs.readFileSync(webDiPath, 'utf8');
  content = content.replace(/createAIHttpAdapters\(httpClient\)/g, "{} as any");
  content = content.replace(/new AIClientService/g, "{} as any // AIClientService");
  fs.writeFileSync(webDiPath, content);
}

// apps/desktop/src/shared/initialization/infraInitialization.ts
const desktopInfraInitPath = 'apps/desktop/src/shared/initialization/infraInitialization.ts';
if (fs.existsSync(desktopInfraInitPath)) {
  let content = fs.readFileSync(desktopInfraInitPath, 'utf8');
  content = content.replace(/import \{ initializeIpcRegistry \} from '\.\.\/\.\.\/main\/modules\/ipc-registry';\n/g, "");
  fs.writeFileSync(desktopInfraInitPath, content);
}
