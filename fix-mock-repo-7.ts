import fs from 'fs';

const mockRepoPath = 'apps/desktop/src/main/ipc/__tests__/mocks/repositories.mock.ts';
let content = fs.readFileSync(mockRepoPath, 'utf8');

// Title error implies `GoalServerDTO` actually doesn't have a `title` (maybe it has `name` or something else? Wait, if we use `as unknown as GoalServerDTO` we avoid this completely)
content = content.replace(/return \{\n/g, 'return {\n');
content = content.replace(/return \{(.*?)\.\.\.overrides,\n  \};/s, 'return {\n$1...overrides,\n  } as unknown as GoalServerDTO;');

fs.writeFileSync(mockRepoPath, content);
