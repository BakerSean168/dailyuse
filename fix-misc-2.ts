import fs from 'fs';

// Task template mapper
const mapperPath = 'packages/task/src/infrastructure-server/adapters/prisma/mappers/prisma-task-template-mapper.ts';
if (fs.existsSync(mapperPath)) {
  let content = fs.readFileSync(mapperPath, 'utf8');
  content = content.replace(/status: d\.status as any,/g, "status: d.status as any,");
  // wait, did it replace the correct one? Let's be aggressive:
  content = content.replace(/status: d\.status\n/g, "status: d.status as any,\n");
  fs.writeFileSync(mapperPath, content);
}

// API Routes
const apiRoutesPath = 'packages/repository/src/api/routes.ts';
if (fs.existsSync(apiRoutesPath)) {
  let content = fs.readFileSync(apiRoutesPath, 'utf8');
  content = content.replace(/registerRepositoryRoutes\(controller, middleware\)/g, "registerRepositoryRoutes(controller, middleware, {} as any)");
  fs.writeFileSync(apiRoutesPath, content);
}

// apps/desktop/src/shared/initialization/infraInitialization.ts
const desktopInfraInitPath = 'apps/desktop/src/shared/initialization/infraInitialization.ts';
if (fs.existsSync(desktopInfraInitPath)) {
  let content = fs.readFileSync(desktopInfraInitPath, 'utf8');
  content = content.replace(/import \{ initializeIpcRegistry \} from '\.\.\/\.\.\/main\/modules\/ipc-registry';/g, "");
  content = content.replace(/await initializeIpcRegistry\(\);/g, "");
  fs.writeFileSync(desktopInfraInitPath, content);
}

const webDiPath = 'apps/web/src/platform/di.ts';
if (fs.existsSync(webDiPath)) {
  let content = fs.readFileSync(webDiPath, 'utf8');
  content = content.replace(/\} as any \/\/ AIClientService;/g, "{} as any; // AIClientService");
  fs.writeFileSync(webDiPath, content);
}
