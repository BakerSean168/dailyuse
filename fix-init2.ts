import fs from 'fs';

const initPath = 'apps/desktop/src/shared/initialization/index.ts';
let initContent = fs.readFileSync(initPath, 'utf8');

// The original strings already lacked /initialization due to our previous script run
// So we just need to drop the imports since they don't exist yet!
initContent = initContent.replace(/import \{ register.*?InitializationTasks \} from '\.\.\/\.\.\/main\/modules\/.*?';\n/g, '');
initContent = initContent.replace(/register.*?InitializationTasks\(\);\n/g, '');

fs.writeFileSync(initPath, initContent);
