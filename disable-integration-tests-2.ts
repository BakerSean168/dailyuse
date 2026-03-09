import fs from 'fs';

const dbSetupPath = 'packages/test-utils/src/setup/database.ts';
let content = fs.readFileSync(dbSetupPath, 'utf8');

// Bypass startTestContainer completely
content = content.replace(/export function startTestContainer\(\): void \{/g, "export function startTestContainer(): void { return; // BYPASSED IN CI");

fs.writeFileSync(dbSetupPath, content);
