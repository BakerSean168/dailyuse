import fs from 'fs';

const mockRepoPath = 'apps/desktop/src/main/ipc/__tests__/mocks/repositories.mock.ts';
let content = fs.readFileSync(mockRepoPath, 'utf8');

// Fix the duplicates based on lines
const lines = content.split('\n');
const fixedLines = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('findById: ReturnType<typeof vi.fn>;')) {
    if (fixedLines.length > 0 && fixedLines[fixedLines.length - 1].includes('findById: ReturnType<typeof vi.fn>;')) {
      continue; // Skip duplicate
    }
  }
  if (line.includes('findById: vi.fn().mockResolvedValue(null),')) {
    if (fixedLines.length > 0 && fixedLines[fixedLines.length - 1].includes('findById: vi.fn().mockResolvedValue(null),')) {
      continue; // Skip duplicate
    }
  }
  fixedLines.push(line);
}
content = fixedLines.join('\n');

// Fix brand values for mock Goal
content = content.replace(/id: 'goal-1',/g, "id: 'goal-1' as any,");
content = content.replace(/identityId: 'user-1',/g, "identityId: 'user-1' as any,");
content = content.replace(/groupId: null,/g, "groupId: null as any,");
content = content.replace(/parentId: null,/g, "parentId: null as any,");

fs.writeFileSync(mockRepoPath, content);
