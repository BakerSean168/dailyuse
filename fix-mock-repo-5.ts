import fs from 'fs';

const mockRepoPath = 'apps/desktop/src/main/ipc/__tests__/mocks/repositories.mock.ts';
let content = fs.readFileSync(mockRepoPath, 'utf8');

content = content.replace(/id: `goal-\$\{goalCounter\}-\$\{now\}`,\n/g, 'id: `goal-${goalCounter}-${now}` as any,\n');
content = content.replace(/identityId: 'test-account-uuid',\n/g, "identityId: 'test-account-uuid' as any,\n");
content = content.replace(/folderId: null,\n/g, "folderId: null as any,\n");

fs.writeFileSync(mockRepoPath, content);
