import fs from 'fs';

const mockRepoPath = 'apps/desktop/src/main/ipc/__tests__/mocks/repositories.mock.ts';
let content = fs.readFileSync(mockRepoPath, 'utf8');

// Fix duplicates
content = content.replace(/findById: vi\.fn\(\),\n    findById: vi\.fn\(\),/g, 'findById: vi.fn(),');
content = content.replace(/findByName: vi\.fn\(\),\n    findByName: vi\.fn\(\),/g, 'findByName: vi.fn(),');

content = content.replace(/@dailyuse\/domain-server\/goal/g, '@dailyuse/goal/domain-server');

content = content.replace(/id: 'goal-1',/g, "id: 'goal-1' as any,");
content = content.replace(/identityId: 'user-1',/g, "identityId: 'user-1' as any,");

content = content.replace(/groupId: null,/g, "groupId: null as any,");


fs.writeFileSync(mockRepoPath, content);
