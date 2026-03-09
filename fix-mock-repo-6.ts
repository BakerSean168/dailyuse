import fs from 'fs';

const mockRepoPath = 'apps/desktop/src/main/ipc/__tests__/mocks/repositories.mock.ts';
let content = fs.readFileSync(mockRepoPath, 'utf8');

content = content.replace(/category: null,\n/g, "category: null as any,\n");
content = content.replace(/color: null,\n/g, "color: null as any,\n");

fs.writeFileSync(mockRepoPath, content);
