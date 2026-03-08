import fs from 'fs';

const webDiPath = 'apps/web/src/platform/di.ts';
let content = fs.readFileSync(webDiPath, 'utf8');

content = content.replace(/import \{ AIClientService \} from '@dailyuse\/ai';\n/g, "");
// And also where it's used
content = content.replace(/AIClientService,/g, "");
content = content.replace(/const aiService = new AIClientService\(httpClient\);\n/g, "const aiService = {} as any;\n");

fs.writeFileSync(webDiPath, content);
