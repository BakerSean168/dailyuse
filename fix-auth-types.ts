import fs from 'fs';

const mockRepoPath = 'apps/desktop/src/main/ipc/__tests__/mocks/repositories.mock.ts';
let mockRepoContent = fs.readFileSync(mockRepoPath, 'utf8');

// fix imports
mockRepoContent = mockRepoContent.replace(
  /import \{ Goal \} from '@dailyuse\/domain-server\/goal';/,
  "import { Goal } from '@dailyuse/goal/domain-server';"
);

// fix duplicate findById
mockRepoContent = mockRepoContent.replace(
  /findById: vi\.fn\(\),\s*findById: vi\.fn\(\),/g,
  "findById: vi.fn(),"
);

// object literal multiple properties
mockRepoContent = mockRepoContent.replace(
  /findByName: vi\.fn\(\),\s*findByName: vi\.fn\(\),/g,
  "findByName: vi.fn(),"
);

// brand casting
mockRepoContent = mockRepoContent.replace(/id: 'goal-1',/g, "id: 'goal-1' as any,");
mockRepoContent = mockRepoContent.replace(/identityId: 'user-1',/g, "identityId: 'user-1' as any,");

fs.writeFileSync(mockRepoPath, mockRepoContent);

const infraInitPath = 'apps/desktop/src/shared/initialization/index.ts';
let infraInitContent = fs.readFileSync(infraInitPath, 'utf8');
infraInitContent = infraInitContent.replace(/\.\.\/\.\.\/main\/modules\/(.*?)\/initialization/g, '../../main/modules/$1');
fs.writeFileSync(infraInitPath, infraInitContent);

const infraSetupPath = 'apps/desktop/src/shared/initialization/infraInitialization.ts';
let infraSetupContent = fs.readFileSync(infraSetupPath, 'utf8');
infraSetupContent = infraSetupContent.replace(/import \{ initializeIpcRegistry \} from '\.\.\/\.\.\/main\/modules\/ipc-registry';/, '');
infraSetupContent = infraSetupContent.replace(/await initializeIpcRegistry\(\);/g, '');
fs.writeFileSync(infraSetupPath, infraSetupContent);
