import fs from 'fs';

const mockRepoPath = 'apps/desktop/src/main/ipc/__tests__/mocks/repositories.mock.ts';
let content = fs.readFileSync(mockRepoPath, 'utf8');

// The file might contain findById twice in different contexts
// Let's manually replace multiple occurrences of same keys
const lines = content.split('\n');
const fixedLines = [];
let insideMock = false;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('findById: vi.fn(),')) {
    if (fixedLines.length > 0 && fixedLines[fixedLines.length - 1].includes('findById: vi.fn(),')) {
      continue;
    }
  }
  if (line.includes('findByName: vi.fn(),')) {
    if (fixedLines.length > 0 && fixedLines[fixedLines.length - 1].includes('findByName: vi.fn(),')) {
      continue;
    }
  }
  fixedLines.push(line);
}
content = fixedLines.join('\n');

// specifically line 152 and 153 for GoalId and IdentityId
content = content.replace(/id: 'goal-1',/g, "id: 'goal-1' as any,");
content = content.replace(/identityId: 'user-1',/g, "identityId: 'user-1' as any,");

// line 161 Type 'null' is not assignable to type 'string'
content = content.replace(/groupId: null,/g, "groupId: null as any,");
content = content.replace(/parentId: null,/g, "parentId: null as any,");


fs.writeFileSync(mockRepoPath, content);
