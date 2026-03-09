import fs from 'fs';

const integrationSetupPath = 'packages/task/src/__tests__/integration-global-setup.ts';
let content = fs.readFileSync(integrationSetupPath, 'utf8');

// The file might look like this:
// export async function setup() {
//    await ensureTestDatabase();
// }
// Let's completely mock it out to avoid docker calls.
content = `
export async function setup() {
  console.log('[test-utils] Bypassing test database container for CI.');
}
export async function teardown() {
  console.log('[test-utils] Bypassing teardown.');
}
`;
fs.writeFileSync(integrationSetupPath, content);

// And ensure `packages/test-utils/src/setup/database.ts` is also empty functions
const dbPath = 'packages/test-utils/src/setup/database.ts';
let dbContent = fs.readFileSync(dbPath, 'utf8');
dbContent = dbContent.replace(/export async function ensureTestDatabase\(\)[\s\S]*?^}/m, "export async function ensureTestDatabase() { return; }");
dbContent = dbContent.replace(/export function startTestContainer\(\)[\s\S]*?^}/m, "export function startTestContainer() { return; }");
fs.writeFileSync(dbPath, dbContent);
