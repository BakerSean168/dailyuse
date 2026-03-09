import fs from 'fs';

const repoRoutesPath = 'packages/repository/src/api/routes.ts';
let repoRoutes = fs.readFileSync(repoRoutesPath, 'utf8');
repoRoutes = repoRoutes.replace(/\(req, ctx\) => controller\.createResource\(\{ identityId: ctx\.identityId, repoId: req\.params!\.repoId, \.\.\.req\.body \}\),/g, "(req) => controller.createResource(req.params!.repoId, req.body, { identityId: (req as any).user?.identityId || 'api-user' } as any),");
fs.writeFileSync(repoRoutesPath, repoRoutes);
