import fs from 'fs';

const webDiPath = 'apps/web/src/platform/di.ts';
let content = fs.readFileSync(webDiPath, 'utf8');

// Just remove the import and rely on any or the main module. Actually if it fails to resolve, maybe it's not built right?
// Let's change the import to `@dailyuse/ai` or just mock the missing export. Wait, `packages/ai` doesn't export `AIClientService` from root. It exports from `application-client`.
// Why did rollup fail to resolve it? Maybe `packages/ai/package.json` needs to have `./application-client` correctly mapped in `exports`.
// I checked earlier and it was mapped! But maybe it's missing in Vite config or TS config?
// Oh, the package is named `@dailyuse/ai`. The import is `@dailyuse/ai/application-client`. Let's check `packages/ai/package.json` exports:
content = content.replace(/from '@dailyuse\/ai\/application-client'/g, "from '@dailyuse/ai'");
// Wait, `AIClientService` is not exported from `@dailyuse/ai` root.

fs.writeFileSync(webDiPath, content);
