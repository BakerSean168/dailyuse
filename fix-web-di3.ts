import fs from 'fs';

const webDiPath = 'apps/web/src/platform/di.ts';
let content = fs.readFileSync(webDiPath, 'utf8');

// There is likely another import from infrastructure-client
content = content.replace(/import \{.*?\} from '@dailyuse\/ai\/infrastructure-client';\n/g, "");

fs.writeFileSync(webDiPath, content);
