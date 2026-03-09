import fs from 'fs';

const repoRoutesPath = 'packages/repository/src/api/routes.ts';
let repoRoutes = fs.readFileSync(repoRoutesPath, 'utf8');
repoRoutes = repoRoutes.replace(/\(req\) => controller\.createResource\(req\.params!\.repoId, req\.body\),/g, "(req, ctx) => controller.createResource({ identityId: ctx.identityId, repoId: req.params!.repoId, ...req.body }),");
fs.writeFileSync(repoRoutesPath, repoRoutes);
