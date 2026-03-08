import fs from 'fs';

const initPath = 'apps/desktop/src/shared/initialization/index.ts';
let initContent = fs.readFileSync(initPath, 'utf8');

// Just remove all of those feature module init imports as they don't seem to exist
initContent = initContent.replace(/import \{ register.*?InitializationTasks \} from '\.\.\/\.\.\/main\/modules\/.*?';\n/g, '');
initContent = initContent.replace(/register.*?InitializationTasks\(\);\n/g, '');
initContent = initContent.replace(/  registerInfrastructureInitializationTasks\(\);\n\n  // Module-specific initialization tasks\n  \/\/ These calls register tasks with the InitializationManager but do not execute them immediately\.\n  \/\/ Execution happens when InitializationManager\.executePhase\(\) is called\.\n\n/g, '  registerInfrastructureInitializationTasks();\n');


fs.writeFileSync(initPath, initContent);

// And we also need to fix `src/shared/initialization/infraInitialization.ts`
const infraInitPath = 'apps/desktop/src/shared/initialization/infraInitialization.ts';
let infraInitContent = fs.readFileSync(infraInitPath, 'utf8');
// remove import { initializeIpcRegistry }
infraInitContent = infraInitContent.replace(/import \{ initializeIpcRegistry \} from '.*?';\n/g, '');
infraInitContent = infraInitContent.replace(/await initializeIpcRegistry\(\);\n/g, '');

fs.writeFileSync(infraInitPath, infraInitContent);
