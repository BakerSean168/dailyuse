import fs from 'fs';

const mapperPath = 'packages/task/src/infrastructure-server/adapters/prisma/mappers/prisma-task-template-mapper.ts';
let content = fs.readFileSync(mapperPath, 'utf8');
content = content.replace(/dependencyStatus: data\.dependencyStatus \?\? 'NONE',/g, "dependencyStatus: (data.dependencyStatus ?? 'NONE') as any,");
fs.writeFileSync(mapperPath, content);
