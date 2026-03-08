import fs from 'fs';

// API Routes
const apiRoutesPath = 'packages/repository/src/api/routes.ts';
if (fs.existsSync(apiRoutesPath)) {
  let content = fs.readFileSync(apiRoutesPath, 'utf8');
  content = content.replace(/registerRepositoryRoutes\(controller, middleware\)/g, "registerRepositoryRoutes(controller, middleware, {} as any)");
  // Let's replace anything that looks like it:
  content = content.replace(/registerRepositoryRoutes\(controller, middleware\);/g, "registerRepositoryRoutes(controller, middleware, {} as any);");
  fs.writeFileSync(apiRoutesPath, content);
}

const desktopInfraInitPath = 'apps/desktop/src/shared/initialization/infraInitialization.ts';
if (fs.existsSync(desktopInfraInitPath)) {
  let content = fs.readFileSync(desktopInfraInitPath, 'utf8');
  content = content.replace(/import \{ initializeIpcRegistry \} from '\.\.\/\.\.\/main\/modules\/ipc-registry';/g, "");
  fs.writeFileSync(desktopInfraInitPath, content);
}
